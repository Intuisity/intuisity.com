const { supabaseRequest } = require("../server/supabase");

module.exports = async function handler(request, response) {
  try {
    const slug = cleanSlug(request.query?.slug);
    const rows = await supabaseRequest(`/articles?status=eq.published${slug ? `&slug=eq.${encodeURIComponent(slug)}` : ""}&select=*&order=published_at.desc.nullslast,updated_at.desc`);
    if (slug && !rows?.length) return sendPage(response, 404, layout({ title: "Article not found | Intuisity", description: "The requested Intuisity article could not be found.", content: '<main><h1>Article not found</h1><p><a href="/articles">Browse Intuisity articles</a></p></main>' }));
    if (slug) return sendPage(response, 200, renderArticle(rows[0]));
    return sendPage(response, 200, renderLibrary(rows || []));
  } catch (error) {
    return sendPage(response, 500, layout({ title: "Intuisity Articles", description: "Intuition training articles from Intuisity.", content: `<main><h1>Intuisity Articles</h1><p>Articles are temporarily unavailable. Please return soon.</p></main>` }));
  }
};

function renderLibrary(articles) {
  const cards = articles.length ? articles.map((article) => `
    <article class="card">
      <p class="eyebrow">${escapeHtml(article.category)}</p>
      <h2><a href="/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h2>
      <p>${escapeHtml(article.description)}</p>
      <p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p>
      <a class="read" href="/articles/${encodeURIComponent(article.slug)}">Read more</a>
    </article>`).join("") : '<p>New Intuisity articles are coming soon.</p>';
  return layout({
    title: "Intuition Training Articles & Guides | Intuisity",
    description: "Explore practical Intuisity articles about intuition training, remote viewing, mindfulness, awareness, synchronicity, and games with friends.",
    canonical: "https://www.intuisity.com/articles",
    content: `<main><p class="eyebrow">Learn and practice</p><h1>Intuisity articles and guides</h1><p class="intro">Explore practical guidance for developing intuition, awareness, mindfulness, remote viewing skills, and confidence in your first impressions.</p><section class="grid">${cards}</section></main>`
  });
}

function renderArticle(article) {
  const canonical = `https://www.intuisity.com/articles/${encodeURIComponent(article.slug)}`;
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    author: { "@type": "Person", name: article.author_name },
    publisher: { "@type": "Organization", name: "Intuisity", url: "https://www.intuisity.com" },
    mainEntityOfPage: canonical
  }).replace(/</g, "\\u003c");
  return layout({
    title: `${article.title} | Intuisity`,
    description: article.description,
    canonical,
    structuredData,
    content: `<main><p class="eyebrow">${escapeHtml(article.category)}</p><h1>${escapeHtml(article.title)}</h1><p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p><p class="intro">${escapeHtml(article.description)}</p><article class="article-body">${renderBody(article.body)}</article><a class="cta" href="${escapeAttribute(article.call_to_action_url)}">${escapeHtml(article.call_to_action_label)}</a><p><a href="/articles">← Back to all articles</a></p></main>`
  });
}

function renderBody(body) {
  return String(body || "").split(/\n{2,}/).map((block) => {
    const text = block.trim();
    if (!text) return "";
    if (text.startsWith("## ")) return `<h2>${escapeHtml(text.slice(3))}</h2>`;
    if (text.startsWith("### ")) return `<h3>${escapeHtml(text.slice(4))}</h3>`;
    return `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
  }).join("\n");
}

function layout({ title, description, canonical = "https://www.intuisity.com/articles", structuredData = "", content }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeAttribute(description)}"><link rel="canonical" href="${escapeAttribute(canonical)}"><link rel="icon" href="/favicon.ico">${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}<style>${pageStyles}</style></head><body><header><a href="/" class="brand">Intuisity</a><nav><a href="/articles">Articles</a><a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="/">Open Intuisity</a></nav></header>${content}<footer>© ${new Date().getFullYear()} Intuisity · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></footer></body></html>`;
}

function sendPage(response, status, html) { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.setHeader("Cache-Control", "public, max-age=0, s-maxage=300"); response.status(status).send(html); }
function cleanSlug(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 120); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
function escapeAttribute(value) { return escapeHtml(value); }
function formatDate(value) { const date = new Date(value || Date.now()); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Los_Angeles" }); }

const pageStyles = `*{box-sizing:border-box}body{margin:0;background:#fbfaff;color:#30264c;font-family:Arial,sans-serif;line-height:1.7}header{align-items:center;background:#fff;border-bottom:1px solid #e6def5;display:flex;justify-content:space-between;padding:16px max(20px,calc((100% - 960px)/2))}.brand{color:#6544b8;font-size:24px;font-weight:900;text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:16px}a{color:#6544b8;font-weight:700}main{margin:0 auto;max-width:900px;padding:48px 20px}h1{font-size:clamp(34px,6vw,56px);line-height:1.1;margin:8px 0 18px}h2{line-height:1.25}.eyebrow{color:#008a94;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.intro{font-size:20px}.meta{color:#706982;font-size:14px}.grid{display:grid;gap:18px;margin-top:32px}.card{background:#fff;border:1px solid #dccff5;border-radius:12px;padding:24px}.card h2{margin:4px 0}.read,.cta{display:inline-block;margin-top:8px}.cta{background:#6544b8;border-radius:8px;color:#fff;padding:12px 18px;text-decoration:none}.article-body{font-size:18px;margin:34px 0}.article-body h2{margin-top:34px}footer{border-top:1px solid #e6def5;margin-top:32px;padding:28px;text-align:center}@media(max-width:620px){header{align-items:flex-start;flex-direction:column;gap:10px}nav{gap:10px}main{padding-top:32px}}`;
