const assert = require("node:assert/strict");
const { INDEXNOW_KEY, articleUrls, notifyIndexNow } = require("../server/indexnow");

const requests = [];
global.fetch = async (url, options) => {
  requests.push({ url, options });
  return { ok: true, status: 200 };
};

(async () => {
  const urls = articleUrls({ slug: "new-practice", category: "Intuition Training" });
  assert.ok(urls.includes("https://www.intuisity.com/articles/new-practice"));
  assert.ok(urls.includes("https://www.intuisity.com/articles/category/intuition-training"));

  const result = await notifyIndexNow([...urls, urls[0], "https://example.com/not-ours"]);
  assert.equal(result.notified, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.indexnow.org/indexnow");
  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.host, "www.intuisity.com");
  assert.equal(payload.key, INDEXNOW_KEY);
  assert.equal(payload.keyLocation, `https://www.intuisity.com/${INDEXNOW_KEY}.txt`);
  assert.equal(payload.urlList.includes("https://example.com/not-ours"), false);
  assert.equal(payload.urlList.length, urls.length, "Duplicate URLs should only be submitted once");

  console.log("IndexNow tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
