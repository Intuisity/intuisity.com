const { supabaseRequest } = require("../server/supabase");

module.exports = async function handler(_request, response) {
  const staticPaths = ["", "privacy.html", "terms.html", "faq.html", "about.html", "intuition-training.html", "remote-viewing-practice.html", "friend-intuition-games.html", "treasure-chest.html", "articles"];
  let articles = [];
  try { articles = await supabaseRequest("/articles?status=eq.published&select=slug,category,updated_at&order=published_at.desc"); } catch { articles = []; }
  const categories = [...new Set(articles.map((article) => categorySlug(article.category)).filter(Boolean))];
  const urls = [
    ...staticPaths.map((path) => ({ loc: `https://www.intuisity.com/${path}`, lastmod: "" })),
    ...categories.map((category) => ({ loc: `https://www.intuisity.com/articles/category/${category}`, lastmod: "" })),
    ...articles.map((article) => ({ loc: `https://www.intuisity.com/articles/${encodeURIComponent(article.slug)}`, lastmod: String(article.updated_at || "").slice(0, 10) }))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
  response.status(200).send(xml);
};

function escapeXml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character])); }
function categorySlug(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
