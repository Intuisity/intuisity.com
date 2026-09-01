const crypto = require("crypto");
const { allowCors, normalizeEmail, readJsonBody, sendJson, supabaseRequest } = require("./supabase");

const confirmationLifetimeMs = 24 * 60 * 60 * 1000;

module.exports = async function accountDeletionHandler(request, response) {
  if (allowCors(request, response)) return;

  if (request.method === "POST") return requestDeletion(request, response);
  if (request.method === "GET") return confirmDeletion(request, response);
  return sendJson(response, 405, { error: "Method not allowed" });
};

async function requestDeletion(request, response) {
  try {
    const body = await readJsonBody(request);
    const email = normalizeEmail(body.email);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return sendJson(response, 400, { error: "A valid account email is required." });
    }

    const rows = await supabaseRequest(`/profiles?email=eq.${encodeURIComponent(email)}&select=email,name&limit=1`);
    if (!Array.isArray(rows) || !rows.length) {
      return sendJson(response, 404, { error: "We could not find an Intuisity account with that email." });
    }

    const expires = Date.now() + confirmationLifetimeMs;
    const token = createToken(email, expires);
    const origin = getPublicOrigin(request);
    const deletionUrl = `${origin}/api/account-deletion?action=confirm&email=${encodeURIComponent(email)}&expires=${expires}&token=${token}`;
    await sendConfirmationEmail(email, rows[0]?.name || body.name || "", deletionUrl);

    return sendJson(response, 200, {
      message: "Check your email and use the secure link within 24 hours to permanently delete your account.",
      ok: true
    });
  } catch (error) {
    return sendJson(response, 500, {
      error: "We could not start account deletion.",
      message: error.message
    });
  }
}

async function confirmDeletion(request, response) {
  try {
    const query = request.query || Object.fromEntries(new URL(request.url || "", "https://www.intuisity.com").searchParams);
    const email = normalizeEmail(query.email);
    const expires = Number(query.expires || 0);
    const token = String(query.token || "");

    if (!email || !Number.isFinite(expires) || expires < Date.now() || !isValidToken(email, expires, token)) {
      return sendHtml(response, 400, "Deletion link expired", "This account-deletion link is invalid or has expired. Open Intuisity and request a new link.");
    }

    await deleteAccountData(email);
    return sendHtml(response, 200, "Your Intuisity account was deleted", "Your account and its associated Intuisity data have been permanently deleted. You may now close this page.");
  } catch (error) {
    return sendHtml(response, 500, "Account deletion was not completed", "We could not complete deletion right now. Please return to Intuisity and request a new deletion link.");
  }
}

async function deleteAccountData(email) {
  const encodedEmail = encodeURIComponent(email);
  const directEmailTables = ["daily_answers", "daily_results", "analytics_events", "module_feedback", "friends"];
  for (const table of directEmailTables) {
    await supabaseRequest(`/${table}?email=eq.${encodedEmail}`, { method: "DELETE" });
  }

  await supabaseRequest(`/treasure_challenges?or=(sender_email.eq.${encodedEmail},friend_email.eq.${encodedEmail})`, { method: "DELETE" });
  await supabaseRequest(`/profiles?email=eq.${encodedEmail}`, { method: "DELETE" });
}

function getDeletionSecret() {
  const secret = process.env.ACCOUNT_DELETION_SECRET || process.env.INTUISITY_ADMIN_SECRET;
  if (!secret) throw new Error("Account deletion is not configured.");
  return secret;
}

function createToken(email, expires) {
  return crypto.createHmac("sha256", getDeletionSecret()).update(`${email}|${expires}`).digest("hex");
}

function isValidToken(email, expires, token) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = Buffer.from(createToken(email, expires), "hex");
  const received = Buffer.from(token, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function getPublicOrigin(request) {
  const forwardedHost = String(request.headers?.["x-forwarded-host"] || request.headers?.host || "www.intuisity.com");
  return forwardedHost.endsWith("intuisity.com") ? `https://${forwardedHost}` : "https://www.intuisity.com";
}

async function sendConfirmationEmail(email, name, deletionUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email delivery is not configured.");
  const safeName = escapeHtml(name || "there");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.INTUISITY_FROM_EMAIL || "Intuisity <admin@intuisity.com>",
      to: [email],
      subject: "Confirm permanent deletion of your Intuisity account",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#30264c;max-width:600px;margin:auto"><h1 style="color:#6537c7">Delete your Intuisity account?</h1><p>Hello ${safeName},</p><p>We received a request to permanently delete your Intuisity account and its associated results, profile, analytics, friend records, and Treasure Chest records.</p><p><a href="${deletionUrl}" style="display:inline-block;background:#6537c7;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Permanently delete my account</a></p><p>This link expires in 24 hours. If you did not request deletion, ignore this email and your account will remain unchanged.</p></div>`
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || "Deletion confirmation email could not be sent.");
}

function sendHtml(response, status, title, message) {
  response.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  return response.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><body style="margin:0;background:#fffaf0;font-family:Arial,sans-serif;color:#30264c"><main style="max-width:620px;margin:8vh auto;padding:32px;background:white;border:2px solid #f3c64d;border-radius:14px"><div style="color:#b87908;font-size:38px">I</div><h1 style="color:#6537c7">${escapeHtml(title)}</h1><p style="font-size:17px;line-height:1.6">${escapeHtml(message)}</p><a href="https://www.intuisity.com" style="color:#6537c7;font-weight:bold">Return to Intuisity</a></main></body></html>`);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

module.exports._private = { createToken, deleteAccountData, isValidToken };
