const assert = require("node:assert/strict");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.INTUISITY_ADMIN_SECRET = "admin-key";

const article = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "trust-your-first-impression",
  title: "Trust Your First Impression",
  description: "Learn a practical way to notice and record an intuitive first impression.",
  body: "Begin with a [free exercise](/free-intuition-test). Read the [development guide](/articles/intuition/how-to-develop-intuition.html).\n\n## Record the signal\n\nWrite down what you noticed before analyzing it. [Unsafe link](javascript:alert(1))",
  author_name: "Kathy Kennedy",
  category: "Intuition Training",
  call_to_action_label: "Try Intuisity",
  call_to_action_url: "/",
  status: "published",
  published_at: "2026-07-30T12:00:00.000Z",
  updated_at: "2026-07-30T12:00:00.000Z"
};

global.fetch = async () => ({ ok: true, text: async () => JSON.stringify([article]) });

function responseRecorder() {
  return {
    headers: {}, statusCode: 0, payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    send(payload) { this.payload = payload; return this; }
  };
}

(async () => {
  const articleApi = require("../server/articles-api");
  const listResponse = responseRecorder();
  await articleApi({ method: "GET", query: {}, headers: {} }, listResponse);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.payload[0].slug, article.slug);

  const articlePage = require("../api/article-page");
  const pageResponse = responseRecorder();
  await articlePage({ query: { slug: article.slug } }, pageResponse);
  assert.equal(pageResponse.statusCode, 200);
  assert.match(pageResponse.payload, /<h1>Trust Your First Impression<\/h1>/);
  assert.match(pageResponse.payload, /application\/ld\+json/);
  assert.match(pageResponse.payload, /<h2>Record the signal<\/h2>/);
  assert.match(pageResponse.payload, /<a href="\/free-intuition-test">free exercise<\/a>/);
  assert.match(pageResponse.payload, /href="\/articles\/intuition-guide-for-beginners-7-day-practice-plan"/);
  assert.doesNotMatch(pageResponse.payload, /href="\/articles\/intuition\/how-to-develop-intuition(?:\.html)?"/);
  assert.doesNotMatch(pageResponse.payload, /href="javascript:/);
  assert.match(pageResponse.payload, /Try it for yourself/);
  assert.match(pageResponse.payload, /<summary>Article Guides<\/summary>/);
  assert.match(pageResponse.payload, /articles\/trust-your-first-impression/);

  const libraryResponse = responseRecorder();
  await articlePage({ query: {} }, libraryResponse);
  assert.equal(libraryResponse.statusCode, 200);
  assert.match(libraryResponse.payload, /Find your subject:/);
  assert.match(libraryResponse.payload, /All guides by subject/);
  assert.match(libraryResponse.payload, /topic-intuition-training/);
  assert.match(libraryResponse.payload, /Intuition Training \(1\)/);

  const categoryResponse = responseRecorder();
  await articlePage({ query: { category: "intuition-training" } }, categoryResponse);
  assert.equal(categoryResponse.statusCode, 200);
  assert.match(categoryResponse.payload, /<h1>Intuition Training<\/h1>/);
  assert.match(categoryResponse.payload, /Trust Your First Impression/);

  const landingResponse = responseRecorder();
  await articlePage({ query: { landing: "free-remote-viewing-practice" } }, landingResponse);
  assert.equal(landingResponse.statusCode, 200);
  assert.match(landingResponse.payload, /<h1>Free Remote Viewing Practice for Beginners<\/h1>/);
  assert.match(landingResponse.payload, /Try Remote Viewing Free/);
  assert.match(landingResponse.payload, /FAQPage/);

  const sitemapResponse = responseRecorder();
  await articlePage({ query: { sitemap: "1" } }, sitemapResponse);
  assert.equal(sitemapResponse.statusCode, 200);
  assert.match(sitemapResponse.payload, /articles\/trust-your-first-impression/);
  assert.match(sitemapResponse.payload, /articles\/category\/intuition-training/);
  assert.match(sitemapResponse.payload, /free-intuition-test/);
  assert.match(sitemapResponse.payload, /free-remote-viewing-practice/);
  console.log("Article publishing tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
