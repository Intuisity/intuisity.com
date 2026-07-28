let supabaseHelpers;

try {
  supabaseHelpers = require("../server/supabase");
} catch {
  supabaseHelpers = require("./_supabase");
}

const { allowCors, normalizeEmail, readJsonBody, sendJson, supabaseRequest } = supabaseHelpers;

module.exports = async function handler(request, response) {
  if (allowCors(request, response)) return;
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

  try {
    const body = await readJsonBody(request);
    const action = String(body.action || "");
    if (action === "google-login") return handleGoogleLogin(body, response);

    const email = normalizeEmail(body.email);
    if (!email) return sendJson(response, 400, { error: "Email is required" });
    const row = await findProfile(email);
    if (!row) return sendJson(response, 404, { error: "We could not find an account with that email." });

    const profile = normalizeProfile(row);
    if (action === "password-login") {
      if (!profile.passwordHash || profile.passwordHash !== body.passwordHash) {
        return sendJson(response, 401, { error: "That password does not match this account." });
      }
      return sendJson(response, 200, { profile });
    }

    if (action === "reset-password") {
      const savedPhone = String(profile.phone || "").replace(/\D/g, "");
      const suppliedPhone = String(body.phone || "").replace(/\D/g, "");
      if (!savedPhone || savedPhone !== suppliedPhone) {
        return sendJson(response, 401, { error: "That phone number does not match this account." });
      }
      profile.passwordHash = String(body.passwordHash || "");
      profile.authProvider = "password";
      await saveProfile(profile);
      return sendJson(response, 200, { profile });
    }

    return sendJson(response, 400, { error: "Unsupported account action" });
  } catch (error) {
    return sendJson(response, 500, { error: "Account service failed", message: error.message });
  }
};

async function handleGoogleLogin(body, response) {
  const accessToken = String(body.accessToken || "");
  if (!accessToken) return sendJson(response, 400, { error: "Google access token is required" });

  const googleResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!googleResponse.ok) return sendJson(response, 401, { error: "Google could not verify this account." });
  const googleProfile = await googleResponse.json();
  const email = normalizeEmail(googleProfile.email);
  if (!email || googleProfile.email_verified === false) {
    return sendJson(response, 401, { error: "Google did not return a verified email address." });
  }

  const row = await findProfile(email);
  const profile = row
    ? { ...normalizeProfile(row), authProvider: "google" }
    : { email, name: googleProfile.name || email, phone: "", language: "en", authProvider: "google" };
  await saveProfile(profile);
  return sendJson(response, 200, { profile });
}

async function findProfile(email) {
  const rows = await supabaseRequest(`/profiles?email=eq.${encodeURIComponent(email)}&select=*&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function normalizeProfile(row) {
  const profileJson = row.profile_json && typeof row.profile_json === "object" ? row.profile_json : {};
  return {
    ...profileJson,
    email: row.email || profileJson.email || "",
    name: row.name || profileJson.name || "",
    phone: row.phone || profileJson.phone || "",
    language: row.language || profileJson.language || "en",
    reminderTime: row.reminder_time || profileJson.reminderTime || "9:00 AM",
    timeZone: row.time_zone || profileJson.timeZone || "",
    birthdate: row.birthdate || profileJson.birthdate || "",
    birthTime: row.birth_time || profileJson.birthTime || "",
    birthCity: row.birth_city || profileJson.birthCity || "",
    birthState: row.birth_state || profileJson.birthState || "",
    birthCountry: row.birth_country || profileJson.birthCountry || "",
    currentCity: row.current_city || profileJson.currentCity || "",
    currentState: row.current_state || profileJson.currentState || "",
    currentCountry: row.current_country || profileJson.currentCountry || "",
    passwordHash: profileJson.passwordHash || "",
    authProvider: profileJson.authProvider || (profileJson.passwordHash ? "password" : "google")
  };
}

async function saveProfile(profile) {
  const email = normalizeEmail(profile.email);
  await supabaseRequest("/profiles?on_conflict=email", {
    body: JSON.stringify({
      email,
      name: profile.name || "",
      phone: profile.phone || "",
      language: profile.language || "en",
      reminder_time: profile.reminderTime || "9:00 AM",
      time_zone: profile.timeZone || "",
      birthdate: profile.birthdate || "",
      birth_time: profile.birthTime || "",
      birth_city: profile.birthCity || "",
      birth_state: profile.birthState || "",
      birth_country: profile.birthCountry || "",
      current_city: profile.currentCity || "",
      current_state: profile.currentState || "",
      current_country: profile.currentCountry || "",
      profile_json: { ...profile, email },
      updated_at: new Date().toISOString()
    }),
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    method: "POST"
  });
}
