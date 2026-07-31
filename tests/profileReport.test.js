const assert = require("node:assert/strict");
const serverReport = require("../server/supabase-report");

assert.equal(serverReport.resolveProfileField({ name: "Kathy", profile_json: { name: "Old name" } }, "name"), "Kathy");
assert.equal(serverReport.resolveProfileField({ name: "", profile_json: { name: "Kathy Kennedy" } }, "name"), "Kathy Kennedy");
assert.equal(serverReport.resolveProfileField({ current_city: "", profile_json: { currentCity: "San Diego" } }, "current_city", "currentCity"), "San Diego");
assert.equal(serverReport.resolveProfileField(null, "name"), "");
assert.equal(
  serverReport.getReportingDateKey(new Date("2026-07-31T02:00:00.000Z"), "America/Los_Angeles"),
  "2026-07-30"
);

const reconciled = serverReport.reconcileAnonymousVisitors([
  { email: "visitor-browser1@anonymous.intuisity", event_json: { visitorId: "browser1" } },
  { email: "person@example.com", event_json: { visitorId: "browser1" } },
  { email: "person@example.com", event_json: { visitorId: "mobile2" } }
]);
assert.deepEqual(reconciled.map((event) => event.email), ["person@example.com", "person@example.com", "person@example.com"]);

assert.deepEqual(
  serverReport.collectKnownEmails({
    profiles: [
      { email: "admin@intuisity.com" },
      { email: "person@example.com" },
      { email: "visitor-x@anonymous.intuisity" }
    ],
    analyticsEvents: [{ email: "admin@intuisity.com" }]
  }),
  ["admin@intuisity.com", "person@example.com"]
);

console.log("Profile report tests passed");
