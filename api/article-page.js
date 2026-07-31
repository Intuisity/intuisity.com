const { supabaseRequest } = require("../server/supabase");
const articleApi = require("../server/articles-api");

module.exports = async function handler(request, response) {
  if (String(request.query?.endpoint || "") === "articles") return articleApi(request, response);
  try {
    const slug = cleanSlug(request.query?.slug);
    const category = cleanSlug(request.query?.category);
    const rows = await supabaseRequest("/articles?status=eq.published&select=*&order=published_at.desc.nullslast,updated_at.desc");
    const articles = rows || [];
    if (String(request.query?.sitemap || "") === "1") return sendSitemap(response, articles);
    if (slug) {
      const article = articles.find((item) => item.slug === slug);
      if (!article) return sendPage(response, 404, layout({ title: "Article not found | Intuisity", description: "The requested Intuisity article could not be found.", content: '<main><h1>Article not found</h1><p><a href="/articles">Browse Intuisity articles</a></p></main>' }));
      return sendPage(response, 200, renderArticle(article, articles));
    }
    if (category) return sendPage(response, 200, renderCategory(category, articles));
    return sendPage(response, 200, renderLibrary(articles));
  } catch {
    return sendPage(response, 500, layout({ title: "Intuisity Articles", description: "Intuition training articles from Intuisity.", content: "<main><h1>Intuisity Articles</h1><p>Articles are temporarily unavailable. Please return soon.</p></main>" }));
  }
};

function sendSitemap(response, articles) {
  const staticPaths = ["", "privacy.html", "terms.html", "faq.html", "about.html", "intuition-training.html", "remote-viewing-practice.html", "friend-intuition-games.html", "treasure-chest.html", "articles"];
  const categories = [...new Set(articles.map((article) => categorySlug(article.category)).filter(Boolean))];
  const urls = [
    ...staticPaths.map((path) => ({ loc: `https://www.intuisity.com/${path}`, lastmod: "" })),
    ...categories.map((category) => ({ loc: `https://www.intuisity.com/articles/category/${category}`, lastmod: "" })),
    ...articles.map((article) => ({ loc: `https://www.intuisity.com/articles/${encodeURIComponent(article.slug)}`, lastmod: String(article.updated_at || "").slice(0, 10) }))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
  return response.status(200).send(xml);
}

function renderLibrary(articles) {
  const groups = categoryGroups(articles);
  const categoryCards = groups.length ? groups.map(([name, items]) => `
    <article class="category-card"><p class="eyebrow">Topic guide</p><h2><a href="/articles/category/${categorySlug(name)}">${escapeHtml(name)}</a></h2><p>${categoryDescription(name)}</p><p>${items.length} ${items.length === 1 ? "guide" : "guides"}</p></article>`).join("") : "";
  return layout({
    title: "Intuition Training Articles, Exercises & Guides | Intuisity",
    description: "Practical guides and exercises for developing intuition, learning remote viewing, making clearer decisions, and testing first impressions.",
    canonical: "https://www.intuisity.com/articles",
    content: `<main><p class="eyebrow">Learn and practice</p><h1>Build your intuition through practice</h1><p class="intro">Choose a topic, learn a practical skill, and then try it inside Intuisity. These guides are designed to help you observe your own impressions without making promises about outcomes.</p>${categoryCards ? `<section class="grid categories">${categoryCards}</section>` : ""}<h2 class="section-title">Latest guides</h2><section class="grid">${renderCards(articles)}</section></main>`
  });
}

function renderCategory(category, articles) {
  const matches = articles.filter((article) => categorySlug(article.category) === category);
  const name = matches[0]?.category || titleFromSlug(category);
  return layout({
    title: `${name} Articles & Exercises | Intuisity`,
    description: categoryDescription(name),
    canonical: `https://www.intuisity.com/articles/category/${category}`,
    content: `<main><p class="breadcrumbs"><a href="/articles">Articles</a> / ${escapeHtml(name)}</p><p class="eyebrow">Intuisity topic guide</p><h1>${escapeHtml(name)}</h1><p class="intro">${categoryDescription(name)}</p><section class="grid">${renderCards(matches)}</section><aside class="practice"><h2>Put what you learned into practice</h2><p>Intuisity offers short activities that let you record an impression before seeing the result.</p><a class="cta" href="/">Try an Intuisity activity</a></aside></main>`
  });
}

function renderArticle(article, articles) {
  const canonical = `https://www.intuisity.com/articles/${encodeURIComponent(article.slug)}`;
  const related = articles.filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3);
  const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.description, datePublished: article.published_at || article.created_at, dateModified: article.updated_at, author: { "@type": "Person", name: article.author_name }, publisher: { "@type": "Organization", name: "Intuisity", url: "https://www.intuisity.com" }, mainEntityOfPage: canonical }).replace(/</g, "\\u003c");
  return layout({
    title: `${article.title} | Intuisity`, description: article.description, canonical, structuredData,
    content: `<main><p class="breadcrumbs"><a href="/articles">Articles</a> / <a href="/articles/category/${categorySlug(article.category)}">${escapeHtml(article.category)}</a></p><p class="eyebrow">${escapeHtml(article.category)}</p><h1>${escapeHtml(article.title)}</h1><p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p><p class="intro">${escapeHtml(article.description)}</p><article class="article-body">${renderBody(article.body)}</article><aside class="practice"><h2>Try it for yourself</h2><p>Practice noticing and recording your first impression before the answer is revealed.</p><a class="cta" href="${escapeAttribute(article.call_to_action_url)}">${escapeHtml(article.call_to_action_label)}</a></aside>${related.length ? `<section class="related"><h2>Continue learning</h2><div class="grid">${renderCards(related)}</div></section>` : ""}<p><a href="/articles">← Back to all articles</a></p></main>`
  });
}

function renderCards(articles) {
  return articles.length ? articles.map((article) => `<article class="card"><p class="eyebrow">${escapeHtml(article.category)}</p><h2><a href="/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.description)}</p><p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p><a class="read" href="/articles/${encodeURIComponent(article.slug)}">Read the guide</a></article>`).join("") : "<p>New guides are coming soon.</p>";
}

function renderBody(body) { return String(body || "").split(/\n{2,}/).map((block) => { const value = block.trim(); if (!value) return ""; if (value.startsWith("## ")) return `<h2>${escapeHtml(value.slice(3))}</h2>`; if (value.startsWith("### ")) return `<h3>${escapeHtml(value.slice(4))}</h3>`; return `<p>${escapeHtml(value).replace(/\n/g, "<br />")}</p>`; }).join("\n"); }
function categoryGroups(articles) { const groups = new Map(); articles.forEach((article) => { const name = article.category || "Intuition Training"; groups.set(name, [...(groups.get(name) || []), article]); }); return [...groups.entries()]; }
function categorySlug(value) { return cleanSlug(value); }
function titleFromSlug(value) { return String(value).split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function categoryDescription(name) { const descriptions = { "Intuition Training": "Practical ways to notice, record, and reflect on intuitive impressions.", "Remote Viewing": "Beginner-friendly explanations and exercises for recording impressions about a hidden target.", "Everyday Intuition": "Thoughtful ways to examine first impressions in decisions, creativity, and daily life.", "Understanding Intuition": "Clear comparisons that help distinguish intuition from anxiety, fear, instinct, and imagination." }; return escapeHtml(descriptions[name] || `Explore practical ${name.toLowerCase()} articles and exercises from Intuisity.`); }
function layout({ title, description, canonical = "https://www.intuisity.com/articles", structuredData = "", content }) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeAttribute(description)}"><link rel="canonical" href="${escapeAttribute(canonical)}"><link rel="icon" href="/favicon.ico">${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}<style>${pageStyles}</style></head><body><header><a href="/" class="brand">Intuisity</a><nav><a href="/articles">Articles</a><a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="/">Open Intuisity</a></nav></header>${content}<footer>© ${new Date().getFullYear()} Intuisity · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></footer></body></html>`; }
function sendPage(response, status, html) { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.setHeader("Cache-Control", "public, max-age=0, s-maxage=300"); response.status(status).send(html); }
function cleanSlug(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
function escapeAttribute(value) { return escapeHtml(value); }
function escapeXml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character])); }
function formatDate(value) { const date = new Date(value || Date.now()); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Los_Angeles" }); }
const pageStyles = `*{box-sizing:border-box}body{margin:0;background:#fbfaff;color:#30264c;font-family:Arial,sans-serif;line-height:1.7}header{align-items:center;background:#fff;border-bottom:1px solid #e6def5;display:flex;justify-content:space-between;padding:16px max(20px,calc((100% - 960px)/2))}.brand{color:#6544b8;font-size:24px;font-weight:900;text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:16px}a{color:#6544b8;font-weight:700}main{margin:0 auto;max-width:900px;padding:48px 20px}h1{font-size:clamp(34px,6vw,56px);line-height:1.1;margin:8px 0 18px}h2{line-height:1.25}.eyebrow{color:#008a94;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.intro{font-size:20px}.meta,.breadcrumbs{color:#706982;font-size:14px}.grid{display:grid;gap:18px;margin-top:24px}.categories{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.card,.category-card,.practice{background:#fff;border:1px solid #dccff5;border-radius:12px;padding:24px}.card h2,.category-card h2{margin:4px 0}.read,.cta{display:inline-block;margin-top:8px}.cta{background:#6544b8;border-radius:8px;color:#fff;padding:12px 18px;text-decoration:none}.article-body{font-size:18px;margin:34px 0}.article-body h2{margin-top:34px}.practice{background:#f0eafa;margin:38px 0}.practice h2{margin-top:0}.related,.section-title{margin-top:46px}footer{border-top:1px solid #e6def5;margin-top:32px;padding:28px;text-align:center}@media(max-width:620px){header{align-items:flex-start;flex-direction:column;gap:10px}nav{gap:10px}main{padding-top:32px}}`;
