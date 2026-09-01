const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.INTUISITY_ADMIN_SECRET = "deletion-secret";
process.env.RESEND_API_KEY = "resend-key";
process.env.INTUISITY_FROM_EMAIL = "Intuisity <admin@intuisity.com>";

const handler = require("../server/account-deletion-api");

function responseRecorder() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    end(value) { this.body = value; return this; },
    json(value) { this.body = value; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; }
  };
}

(async () => {
  const requests = [];
  let confirmationUrl = "";
  global.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    if (String(url).includes("/profiles?") && options.method !== "DELETE") {
      return { ok: true, status: 200, text: async () => JSON.stringify([{ email: "person@example.com", name: "Person" }]) };
    }
    if (String(url).includes("api.resend.com")) {
      const email = JSON.parse(options.body);
      confirmationUrl = email.html.match(/href="([^"]+)"/)?.[1] || "";
      return { ok: true, status: 200, json: async () => ({ id: "email-1" }) };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  const requestResponse = responseRecorder();
  await handler({ body: { email: "Person@Example.com", name: "Person" }, headers: { host: "www.intuisity.com" }, method: "POST" }, requestResponse);
  assert.equal(requestResponse.statusCode, 200);
  assert.equal(requestResponse.body.ok, true);
  assert.ok(confirmationUrl.includes("/api/account-deletion?action=confirm"));

  const parsed = new URL(confirmationUrl);
  const confirmResponse = responseRecorder();
  await handler({ method: "GET", query: Object.fromEntries(parsed.searchParams) }, confirmResponse);
  assert.equal(confirmResponse.statusCode, 200);
  assert.ok(String(confirmResponse.body).includes("permanently deleted"));

  const deleteUrls = requests.filter((entry) => entry.options.method === "DELETE").map((entry) => entry.url);
  assert.ok(deleteUrls.some((url) => url.includes("/profiles?email=eq.person%40example.com")));
  assert.ok(deleteUrls.some((url) => url.includes("/treasure_challenges?or=")));
  assert.ok(deleteUrls.some((url) => url.includes("/analytics_events?email=eq.person%40example.com")));

  const expiredResponse = responseRecorder();
  const expired = Date.now() - 1000;
  await handler({ method: "GET", query: { email: "person@example.com", expires: String(expired), token: handler._private.createToken("person@example.com", expired) } }, expiredResponse);
  assert.equal(expiredResponse.statusCode, 400);

  console.log("Account deletion tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
