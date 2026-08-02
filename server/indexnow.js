const INDEXNOW_KEY = "f11106c1f9834fc3b1b46139f30654c3";
const SITE_HOST = "www.intuisity.com";
const SITE_ORIGIN = `https://${SITE_HOST}`;

async function notifyIndexNow(urls) {
  const urlList = [...new Set((urls || []).map(normalizeSiteUrl).filter(Boolean))];
  if (!urlList.length) return { notified: false, reason: "no-valid-urls" };

  try {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
        urlList
      })
    };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      options.signal = AbortSignal.timeout(5000);
    }
    const response = await fetch("https://api.indexnow.org/indexnow", options);
    if (!response.ok && response.status !== 202) {
      console.warn("indexnow_notification_rejected", { status: response.status, urlCount: urlList.length });
      return { notified: false, status: response.status };
    }
    console.info("indexnow_notification_accepted", { status: response.status, urlCount: urlList.length });
    return { notified: true, status: response.status, urlCount: urlList.length };
  } catch (error) {
    console.warn("indexnow_notification_failed", { message: error instanceof Error ? error.message : String(error), urlCount: urlList.length });
    return { notified: false, reason: "request-failed" };
  }
}

function articleUrls(article) {
  if (!article?.slug) return [];
  const category = categorySlug(article.category);
  return [
    `${SITE_ORIGIN}/articles/${encodeURIComponent(article.slug)}`,
    `${SITE_ORIGIN}/articles`,
    category ? `${SITE_ORIGIN}/articles/category/${category}` : "",
    `${SITE_ORIGIN}/sitemap.xml`
  ].filter(Boolean);
}

function normalizeSiteUrl(value) {
  try {
    const url = new URL(String(value || ""), SITE_ORIGIN);
    return url.protocol === "https:" && url.hostname === SITE_HOST ? url.toString() : "";
  } catch {
    return "";
  }
}

function categorySlug(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

module.exports = { INDEXNOW_KEY, articleUrls, notifyIndexNow };
