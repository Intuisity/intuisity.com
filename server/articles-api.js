const crypto = require("node:crypto");
const { allowCors, readJsonBody, requireAdminSecret, sendJson, supabaseRequest } = require("./supabase");

module.exports = async function handler(request, response) {
  if (allowCors(request, response)) return;
  try {
    if (request.method === "GET") return getArticles(request, response);
    if (request.method === "POST") return saveArticle(request, response);
    if (request.method === "DELETE") return deleteArticle(request, response);
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 500, { error: "Article request failed", message: error instanceof Error ? error.message : String(error) });
  }
};

async function getArticles(request, response) {
  const admin = String(request.query?.admin || "") === "1";
  if (admin && requireAdminSecret(request, response)) return;
  const slug = cleanSlug(request.query?.slug);
  const filters = [
    slug ? `slug=eq.${encodeURIComponent(slug)}` : "",
    admin ? "" : "status=eq.published",
    "select=*",
    "order=published_at.desc.nullslast,updated_at.desc"
  ].filter(Boolean).join("&");
  const rows = await supabaseRequest(`/articles?${filters}`);
  return sendJson(response, 200, slug ? (rows?.[0] || null) : (rows || []));
}

async function saveArticle(request, response) {
  if (requireAdminSecret(request, response)) return;
  const body = await readJsonBody(request);
  const now = new Date().toISOString();
  const id = validUuid(body.id) ? body.id : crypto.randomUUID();
  const status = body.status === "published" ? "published" : "draft";
  const article = {
    id,
    slug: cleanSlug(body.slug || body.title),
    title: cleanText(body.title, 140),
    description: cleanText(body.description, 300),
    body: cleanText(body.body, 50000),
    author_name: cleanText(body.authorName || "Kathy Kennedy", 100),
    category: cleanText(body.category || "Intuition Training", 100),
    call_to_action_label: cleanText(body.callToActionLabel || "Try Intuisity", 100),
    call_to_action_url: cleanPath(body.callToActionUrl || "/"),
    status,
    published_at: status === "published" ? (body.publishedAt || now) : null,
    updated_at: now
  };
  if (!article.slug || !article.title || !article.description || !article.body) {
    return sendJson(response, 400, { error: "Title, slug, description, and article body are required" });
  }
  const existing = await supabaseRequest(`/articles?id=eq.${encodeURIComponent(id)}&select=id&limit=1`);
  const rows = existing?.length
    ? await supabaseRequest(`/articles?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(article) })
    : await supabaseRequest("/articles", { method: "POST", body: JSON.stringify({ ...article, created_at: now }) });
  return sendJson(response, 200, rows?.[0] || article);
}

async function deleteArticle(request, response) {
  if (requireAdminSecret(request, response)) return;
  const id = String(request.query?.id || "");
  if (!validUuid(id)) return sendJson(response, 400, { error: "Valid article id is required" });
  await supabaseRequest(`/articles?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return sendJson(response, 200, { ok: true });
}

function cleanSlug(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
function cleanText(value, limit) { return String(value || "").trim().slice(0, limit); }
function cleanPath(value) { const text = String(value || "/").trim(); return /^https:\/\//i.test(text) || text.startsWith("/") ? text.slice(0, 500) : "/"; }
function validUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
