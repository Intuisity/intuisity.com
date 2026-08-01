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

const premiumInterest = serverReport.buildPremiumInterest([
  {
    email: "person@example.com",
    module_id: "premium-interest",
    recorded_at: "2026-08-01T10:00:00.000Z",
    event_json: { clientChannel: "mobile-web" }
  },
  {
    email: "person@example.com",
    module_id: "premium-interest",
    recorded_at: "2026-08-01T11:00:00.000Z",
    event_json: { clientChannel: "app" }
  },
  {
    email: "visitor-x@anonymous.intuisity",
    module_id: "premium-interest",
    recorded_at: "2026-08-01T12:00:00.000Z",
    event_json: {}
  }
], [{ email: "person@example.com", name: "Pat", phone: "555-555-0100" }]);
assert.deepEqual(premiumInterest, [{
  email: "person@example.com",
  name: "Pat",
  phone: "555-555-0100",
  platform: "App",
  requestedAt: "2026-08-01T11:00:00.000Z"
}]);

const geographicAreas = serverReport.buildGeographicAreas([
  { email: "one@example.com", current_city: "San Diego", current_state: "California", current_country: "United States" },
  { email: "two@example.com", profile_json: { currentCity: "San Diego", currentState: "California", currentCountry: "United States" } },
  { email: "three@example.com", current_city: "Austin", current_state: "Texas", current_country: "United States" },
  { email: "one@example.com", current_city: "San Diego", current_state: "California", current_country: "United States" },
  { email: "admin@intuisity.com", current_city: "Admin City", current_country: "United States" }
]);
assert.equal(geographicAreas.totalUsers, 3);
assert.equal(geographicAreas.usersWithLocation, 3);
assert.deepEqual(geographicAreas.countries, [{ label: "United States", count: 3 }]);
assert.deepEqual(geographicAreas.states.slice(0, 2), [
  { label: "California, United States", count: 2 },
  { label: "Texas, United States", count: 1 }
]);
assert.deepEqual(geographicAreas.cities.slice(0, 2), [
  { label: "San Diego, California", count: 2 },
  { label: "Austin, Texas", count: 1 }
]);

const acquisitionSources = serverReport.buildAcquisitionSources([
  { email: "search@example.com", started_at: "2026-08-01T10:00:00.000Z", event_json: { referrer: "https://www.google.com/search?q=intuition" } },
  { email: "friend@example.com", started_at: "2026-08-01T10:00:00.000Z", event_json: { landingPath: "/?treasureInvite=1&challenge=abc", treasureInvite: true } },
  { email: "direct@example.com", started_at: "2026-08-01T10:00:00.000Z", event_json: {} },
  { email: "search@example.com", started_at: "2026-08-01T11:00:00.000Z", event_json: {} }
]);
assert.deepEqual(acquisitionSources, [
  { source: "direct", label: "Direct or unknown", uniqueVisitors: 1 },
  { source: "friend-challenge", label: "Friend/Treasure Chest invite", uniqueVisitors: 1 },
  { source: "search", label: "Search engine", uniqueVisitors: 1 }
]);

console.log("Profile report tests passed");
