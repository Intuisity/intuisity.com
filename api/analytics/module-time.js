const { allowCors, normalizeEmail, readJsonBody, sendJson, supabaseRequest } = require("../_supabase");
const idleStopMs = 180000;

module.exports = async function handler(request, response) {
  if (allowCors(request, response)) return;
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

  try {
    const body = await readJsonBody(request);
    const email = normalizeEmail(body.email);
    if (!email) return sendJson(response, 400, { error: "Email is required" });

    const durationMs = Number(body.durationMs || 0);
    const activeDurationMs = body.activeDurationMs === undefined || body.activeDurationMs === null
      ? Math.min(durationMs, idleStopMs)
      : Math.min(durationMs, Number(body.activeDurationMs || 0));
    const requestLocation = getRequestLocation(request);

    const payload = {
      email,
      module_id: body.moduleId || "",
      module_label: body.moduleLabel || "Unknown area",
      started_at: body.startedAt || new Date().toISOString(),
      duration_ms: durationMs,
      active_duration_ms: activeDurationMs,
      date: body.date || new Date().toISOString().slice(0, 10),
      event_json: {
        ...(body || {}),
        currentCity: body.currentCity || requestLocation.currentCity || "",
        currentState: body.currentState || requestLocation.currentState || "",
        currentCountry: body.currentCountry || requestLocation.currentCountry || ""
      },
      recorded_at: new Date().toISOString()
    };

    try {
      await supabaseRequest("/analytics_events", {
        body: JSON.stringify(payload),
        method: "POST"
      });
    } catch (error) {
      if (!String(error.message || "").includes("active_duration_ms")) {
        throw error;
      }

      const { active_duration_ms, ...legacyPayload } = payload;
      await supabaseRequest("/analytics_events", {
        body: JSON.stringify({
          ...legacyPayload,
          event_json: {
            ...(body || {}),
            activeDurationMs: active_duration_ms,
            activeDurationFallback: true
          }
        }),
        method: "POST"
      });
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendJson(response, 500, { error: "Analytics sync failed", message: error.message });
  }
};

function getRequestLocation(request) {
  const headers = request.headers || {};
  const city = decodeHeaderValue(headers["x-vercel-ip-city"] || headers["x-intuisity-city"]);
  const state = decodeHeaderValue(headers["x-vercel-ip-country-region"] || headers["x-vercel-ip-region"] || headers["x-intuisity-region"]);
  const country = normalizeCountry(headers["x-vercel-ip-country"] || headers["x-intuisity-country"]);

  return {
    currentCity: city,
    currentState: state,
    currentCountry: country
  };
}

function decodeHeaderValue(value) {
  const text = Array.isArray(value) ? value[0] : value;
  if (!text) return "";
  try {
    return decodeURIComponent(String(text).replace(/\+/g, " ")).trim();
  } catch {
    return String(text).trim();
  }
}

function normalizeCountry(value) {
  const country = decodeHeaderValue(value).toUpperCase();
  const countryMap = {
    AU: "Australia",
    CA: "Canada",
    GB: "United Kingdom",
    IN: "India",
    MX: "Mexico",
    US: "United States"
  };
  return countryMap[country] || country;
}
