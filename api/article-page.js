const { supabaseRequest } = require("../server/supabase");
const articleApi = require("../server/articles-api");

module.exports = async function handler(request, response) {
  if (String(request.query?.endpoint || "") === "articles") return articleApi(request, response);
  try {
    const slug = cleanSlug(request.query?.slug);
    const category = cleanSlug(request.query?.category);
    const landing = cleanSlug(request.query?.landing);
    const rows = await supabaseRequest("/articles?status=eq.published&select=*&order=published_at.desc.nullslast,updated_at.desc");
    const articles = rows || [];
    if (String(request.query?.sitemap || "") === "1") return sendSitemap(response, articles);
    if (landing && landingPages[landing]) return sendPage(response, 200, renderLanding(landingPages[landing], articles));
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
  const staticPaths = ["", "privacy.html", "terms.html", "faq.html", "about.html", "intuition-training.html", "remote-viewing-practice.html", "friend-intuition-games.html", "treasure-chest.html", "articles", ...Object.keys(landingPages)];
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

const landingPages = {
  "free-intuition-test": {
    title: "Free Intuition Test: Practice Your First Impressions",
    description: "Take a free intuition test with quick visual challenges, immediate feedback, and a simple way to track your first impressions.",
    eyebrow: "Free intuition practice",
    intro: "An intuition test is most useful when you record an impression before seeing the answer. Intuisity gives you short, low-pressure challenges with immediate feedback, so you can observe how your own first impressions show up over time.",
    ctaUrl: "/", ctaLabel: "Try the Free Intuition Test",
    sections: [
      ["What does the test measure?", "The activities compare the choice you make before a reveal with the answer shown afterward. A single result cannot prove or disprove intuitive ability. Repeated play can help you notice patterns, separate quick impressions from later analysis, and become more comfortable with uncertainty."],
      ["How to take the test", "Choose a quiet moment, read one prompt at a time, and record your first response without changing it. Reveal the answer, notice both matches and misses, and continue without judging yourself. Your history is more informative than any one unusually good or difficult round."],
      ["Get more useful feedback", "Keep the sessions brief and use the same honest standard for every answer. Notice whether your response began as a color, image, body sensation, word, or simple preference. Avoid turning a vague match into an exact one after seeing the result."],
      ["Practice, not a promise", "Intuisity is designed for personal exploration and entertainment. The test does not provide medical, psychological, legal, or financial guidance, and it should not replace evidence or qualified advice for important decisions."]
    ],
    faqs: [["Is the intuition test free?", "Yes. You can try Intuisity activities without paying."], ["Do I need to create an account?", "You can begin as a guest. Creating a free account lets you keep your progress."], ["Will one test tell me how intuitive I am?", "No. One short session is only one sample; patterns across repeated sessions are more useful."]],
    relatedSlug: "can-intuition-be-improved-with-practice"
  },
  "daily-intuition-challenge": {
    title: "Daily Intuition Challenge: A Free Practice Routine",
    description: "Build a short daily intuition routine with varied challenges, immediate feedback, and progress tracking in Intuisity.",
    eyebrow: "A few minutes each day",
    intro: "A daily intuition challenge turns an abstract idea into a repeatable habit. Intuisity presents short activities that encourage you to pause, choose, record, and then compare your impression with feedback.",
    ctaUrl: "/", ctaLabel: "Start Today’s Free Challenge",
    sections: [
      ["Why practice daily?", "Regular short sessions make it easier to compare your process under different conditions. You may notice how rest, stress, excitement, or overthinking affects your choices. Consistency creates a record without requiring a long daily commitment."],
      ["What happens in a challenge?", "The daily experience uses several kinds of prompts rather than repeating one identical guess. You make a selection before the result is shown, receive feedback, and build a score that reflects completed activities."],
      ["A grounded daily routine", "Pause for one breath before answering. Notice the first signal, record it, and avoid changing the response just to feel more certain. After the reveal, acknowledge direct matches, partial similarities, and misses with the same level of care."],
      ["Track progress without chasing perfection", "Daily practice is not about being correct every time. Look for long-term patterns and treat a miss as useful feedback. A free account can preserve your activity history so you can reflect on more than a single day."]
    ],
    faqs: [["How long does the daily challenge take?", "Most people can complete the short activities in a few minutes."], ["Is there a new challenge each day?", "Intuisity provides a daily set of activities designed for repeated practice."], ["What if I miss a day?", "Simply return when you can. A sustainable habit is more useful than an all-or-nothing streak."]],
    relatedSlug: "can-intuition-be-improved-with-practice"
  },
  "free-remote-viewing-practice": {
    title: "Free Remote Viewing Practice for Beginners",
    description: "Try a free beginner remote viewing exercise with a hidden picture target, drawing pad, sensory notes, and feedback.",
    eyebrow: "Hidden-target exercise",
    intro: "In a remote viewing practice session, you record impressions about a hidden target before revealing it. Intuisity provides a target, space for sensory notes and drawing, and clear visual feedback at the end.",
    ctaUrl: "/", ctaLabel: "Try Remote Viewing Free",
    sections: [
      ["Start with sensory qualities", "Instead of trying to name the target immediately, record simple qualities such as bright, rough, curved, open, cool, vertical, or moving. Raw descriptions are easier to compare honestly than a detailed story built around an early guess."],
      ["Use the drawing pad", "Sketch boundaries, directions, clusters, height, and movement without trying to create finished artwork. The purpose is to preserve spatial impressions. Add short labels when a line represents texture, motion, or an uncertain element."],
      ["Reveal and compare", "Stop recording before revealing the target image. Compare specific observations with visible features, and keep misses in the record. A phrase that could describe almost anything should not be treated as an exact match."],
      ["Keep expectations realistic", "Remote viewing has disputed scientific support. Intuisity presents it as an attention and feedback exercise, not a guaranteed method of obtaining information. Short, curious sessions are a sensible way to explore the experience."]
    ],
    faqs: [["Do I need remote viewing experience?", "No. The exercise is designed so beginners can start with basic sensory impressions."], ["Can I draw on my phone?", "Yes. The drawing pad supports touch input on compatible phones and tablets."], ["Is remote viewing scientifically proven?", "Scientific support is disputed, so the activity should be approached as personal exploration rather than a guaranteed ability."]],
    relatedSlug: "remote-viewing-exercises-for-beginners"
  },
  "intuition-games-for-adults": {
    title: "Free Intuition Games for Adults",
    description: "Play free intuition games for adults using colors, images, first impressions, remote viewing, and immediate feedback.",
    eyebrow: "Play, observe, learn",
    intro: "Intuition games give adults a structured way to explore first impressions without turning the experience into a high-stakes decision. Intuisity combines varied prompts, quick feedback, and progress tracking in a playful daily routine.",
    ctaUrl: "/", ctaLabel: "Play Intuition Games Free",
    sections: [
      ["Different ways to practice", "Some activities ask you to choose between colors or images. Others focus on a person, a hidden visual target, or a challenge shared by a friend. Variety can help you notice whether your impressions arrive visually, verbally, physically, or as a simple preference."],
      ["Why feedback matters", "A reveal prevents the exercise from becoming an open-ended interpretation. You record a response first, see the result second, and preserve both matches and misses. This creates a more honest learning loop."],
      ["Make the game useful", "Choose quickly enough to capture a first impression but not so quickly that you ignore the prompt. Notice what appeared before your explanation. If you change your mind, record why rather than rewriting the original signal."],
      ["Designed for low-pressure exploration", "These games are for entertainment, self-observation, and attention practice. They do not predict important outcomes and should not replace research, professional advice, or thoughtful reasoning."]
    ],
    faqs: [["Are the games suitable for beginners?", "Yes. Each activity is short and provides a result or reveal."], ["Are the intuition games free?", "Intuisity includes free play and free account options."], ["Can I track my results?", "A free account lets you preserve progress and review your activity over time."]],
    relatedSlug: "can-intuition-be-improved-with-practice"
  },
  "intuition-games-with-friends": {
    title: "Free Intuition Games to Play With Friends",
    description: "Create and share free intuition challenges with friends using Treasure Chest links, email invitations, and phone sharing.",
    eyebrow: "Shared intuition challenges",
    intro: "Playing with a friend adds surprise and clear feedback to intuition practice. In Intuisity’s Treasure Chest, one person prepares a hidden arrangement and sends a challenge link for the other person to solve.",
    ctaUrl: "/?play=treasure", ctaLabel: "Start a Free Friend Challenge",
    sections: [
      ["How Treasure Chest works", "The sender arranges the hidden pieces, enters the friend’s contact information, and creates a challenge. The friend opens the shared link, makes selections without seeing the original arrangement, and receives the result after completing the game."],
      ["Share without paid text messages", "Email invitations can be delivered automatically. On a phone, the Text Challenge Link option opens the device’s normal Messages app with the invitation prepared; the sender reviews and sends it through their own phone plan."],
      ["Keep the challenge friendly", "Agree that the purpose is curiosity rather than competition. Avoid giving hints before the reveal. Compare the full result, celebrate interesting matches, and allow misses to remain part of the game."],
      ["Use clear feedback", "A prepared hidden answer makes the activity easier to evaluate than an open-ended question. Intuisity preserves challenge status and scoring so both people can follow what happened."]
    ],
    faqs: [["Does my friend need the app?", "No. A friend can open the challenge link on the web."], ["Can I send the challenge by text?", "On a phone, Intuisity can prepare the message and link in the normal Messages app for you to send."], ["Can I challenge more than one friend?", "You can create and share additional Treasure Chest challenges with other friends."]],
    relatedSlug: "can-intuition-be-improved-with-practice"
  },
  "five-minute-intuition-exercise": {
    title: "A Five-Minute Intuition Exercise You Can Try Free",
    description: "Try a simple five-minute intuition exercise: pause, record a first impression, reveal the answer, and reflect on the feedback.",
    eyebrow: "Quick guided practice",
    intro: "You do not need a long session to practice noticing first impressions. This five-minute exercise uses one clear prompt, a recorded response, and feedback to create a small but complete learning loop.",
    ctaUrl: "/", ctaLabel: "Begin the Free Exercise",
    sections: [
      ["Minute one: settle", "Choose a low-pressure moment and take one slow breath. Let your attention move away from the desire to be correct. Read the prompt once and keep the question simple."],
      ["Minutes two and three: record", "Notice the first color, shape, word, bodily sensation, or preference that appears. Write or select it before adding an explanation. If a second answer arrives, note that it was second rather than replacing the first."],
      ["Minute four: reveal", "Complete the activity and view the result. Look for exact matches, partial relationships, and clear differences. Do not stretch a general phrase until it fits the answer."],
      ["Minute five: reflect", "Ask what the first signal felt like and when analysis began. Save the result, then move on without judging yourself. Repeating the same honest process on different days is more useful than dwelling on one score."]
    ],
    faqs: [["Can five minutes make a difference?", "Five minutes is enough to complete a focused feedback exercise and begin building a consistent record."], ["What should I do if I feel nothing?", "Choose anyway, record that the impression felt unclear, and compare the result without forcing an experience."], ["How often should I practice?", "A few short sessions each week can be easier to sustain and review than occasional long sessions."]],
    relatedSlug: "how-to-tell-intuition-from-anxiety"
  }
};

function renderLanding(page, articles) {
  const path = Object.keys(landingPages).find((key) => landingPages[key] === page);
  const canonical = `https://www.intuisity.com/${path}`;
  const related = articles.find((article) => article.slug === page.relatedSlug);
  const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }).replace(/</g, "\\u003c");
  return layout({
    title: `${page.title} | Intuisity`, description: page.description, canonical, structuredData, navArticles: articles,
    content: `<main class="landing"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.title)}</h1><p class="intro">${escapeHtml(page.intro)}</p><a class="cta primary-cta" href="${escapeAttribute(page.ctaUrl)}">${escapeHtml(page.ctaLabel)}</a><p class="free-note">Free to try · No payment required</p><section class="landing-sections">${page.sections.map(([heading, text]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></section>`).join("")}</section><section class="faq"><h2>Frequently asked questions</h2>${page.faqs.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</section>${related ? `<aside class="practice"><h2>Learn more before you play</h2><p>${escapeHtml(related.description)}</p><a href="/articles/${encodeURIComponent(related.slug)}">Read ${escapeHtml(related.title)}</a></aside>` : ""}<aside class="final-cta"><h2>Ready to try it?</h2><p>Record your first impression and receive feedback inside Intuisity.</p><a class="cta" href="${escapeAttribute(page.ctaUrl)}">${escapeHtml(page.ctaLabel)}</a></aside></main>`
  });
}

function renderLibrary(articles) {
  const groups = categoryGroups(articles);
  const categoryCards = groups.length ? groups.map(([name, items]) => `
    <article class="category-card"><p class="eyebrow">Topic guide</p><h2><a href="/articles/category/${categorySlug(name)}">${escapeHtml(name)}</a></h2><p>${categoryDescription(name)}</p><p>${items.length} ${items.length === 1 ? "guide" : "guides"}</p></article>`).join("") : "";
  return layout({
    title: "Intuition Training Articles, Exercises & Guides | Intuisity",
    description: "Practical guides and exercises for developing intuition, learning remote viewing, making clearer decisions, and testing first impressions.",
    canonical: "https://www.intuisity.com/articles",
    navArticles: articles,
    content: `<main><p class="eyebrow">Learn and practice</p><h1>Build your intuition through practice</h1><p class="intro">Choose a topic, learn a practical skill, and then try it inside Intuisity. These guides are designed to help you observe your own impressions without making promises about outcomes.</p><h2 class="section-title">Free activities</h2><section class="grid categories">${renderActivityLinks()}</section>${categoryCards ? `<h2 class="section-title">Browse by topic</h2><section class="grid categories">${categoryCards}</section>` : ""}<h2 class="section-title">Latest guides</h2><section class="grid">${renderCards(articles)}</section></main>`
  });
}

function renderCategory(category, articles) {
  const matches = articles.filter((article) => categorySlug(article.category) === category);
  const name = matches[0]?.category || titleFromSlug(category);
  return layout({
    title: `${name} Articles & Exercises | Intuisity`,
    description: categoryDescription(name),
    canonical: `https://www.intuisity.com/articles/category/${category}`,
    navArticles: articles,
    content: `<main><p class="breadcrumbs"><a href="/articles">Articles</a> / ${escapeHtml(name)}</p><p class="eyebrow">Intuisity topic guide</p><h1>${escapeHtml(name)}</h1><p class="intro">${categoryDescription(name)}</p><section class="grid">${renderCards(matches)}</section><aside class="practice"><h2>Put what you learned into practice</h2><p>Intuisity offers short activities that let you record an impression before seeing the result.</p><a class="cta" href="/">Try an Intuisity activity</a></aside></main>`
  });
}

function renderArticle(article, articles) {
  const canonical = `https://www.intuisity.com/articles/${encodeURIComponent(article.slug)}`;
  const related = articles.filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3);
  const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.description, datePublished: article.published_at || article.created_at, dateModified: article.updated_at, author: { "@type": "Person", name: article.author_name }, publisher: { "@type": "Organization", name: "Intuisity", url: "https://www.intuisity.com" }, mainEntityOfPage: canonical }).replace(/</g, "\\u003c");
  return layout({
    title: `${article.title} | Intuisity`, description: article.description, canonical, structuredData, navArticles: articles,
    content: `<main><p class="breadcrumbs"><a href="/articles">Articles</a> / <a href="/articles/category/${categorySlug(article.category)}">${escapeHtml(article.category)}</a></p><p class="eyebrow">${escapeHtml(article.category)}</p><h1>${escapeHtml(article.title)}</h1><p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p><p class="intro">${escapeHtml(article.description)}</p><article class="article-body">${renderBody(article.body)}</article><aside class="practice"><h2>Try it for yourself</h2><p>Practice noticing and recording your first impression before the answer is revealed.</p><a class="cta" href="${escapeAttribute(article.call_to_action_url)}">${escapeHtml(article.call_to_action_label)}</a></aside>${related.length ? `<section class="related"><h2>Continue learning</h2><div class="grid">${renderCards(related)}</div></section>` : ""}<p><a href="/articles">← Back to all articles</a></p></main>`
  });
}

function renderCards(articles) {
  return articles.length ? articles.map((article) => `<article class="card"><p class="eyebrow">${escapeHtml(article.category)}</p><h2><a href="/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.description)}</p><p class="meta">By ${escapeHtml(article.author_name)} · ${formatDate(article.published_at || article.updated_at)}</p><a class="read" href="/articles/${encodeURIComponent(article.slug)}">Read the guide</a></article>`).join("") : "<p>New guides are coming soon.</p>";
}

function renderActivityLinks() { return Object.entries(landingPages).map(([path, page]) => `<article class="category-card"><p class="eyebrow">Try it free</p><h2><a href="/${path}">${escapeHtml(page.title)}</a></h2><p>${escapeHtml(page.description)}</p><a class="read" href="/${path}">Explore this activity</a></article>`).join(""); }

function renderBody(body) { return String(body || "").split(/\n{2,}/).map((block) => { const value = block.trim(); if (!value) return ""; if (value.startsWith("## ")) return `<h2>${escapeHtml(value.slice(3))}</h2>`; if (value.startsWith("### ")) return `<h3>${escapeHtml(value.slice(4))}</h3>`; return `<p>${escapeHtml(value).replace(/\n/g, "<br />")}</p>`; }).join("\n"); }
function categoryGroups(articles) { const groups = new Map(); articles.forEach((article) => { const name = article.category || "Intuition Training"; groups.set(name, [...(groups.get(name) || []), article]); }); return [...groups.entries()]; }
function categorySlug(value) { return cleanSlug(value); }
function titleFromSlug(value) { return String(value).split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function categoryDescription(name) { const descriptions = { "Intuition Training": "Practical ways to notice, record, and reflect on intuitive impressions.", "Remote Viewing": "Beginner-friendly explanations and exercises for recording impressions about a hidden target.", "Everyday Intuition": "Thoughtful ways to examine first impressions in decisions, creativity, and daily life.", "Understanding Intuition": "Clear comparisons that help distinguish intuition from anxiety, fear, instinct, and imagination." }; return escapeHtml(descriptions[name] || `Explore practical ${name.toLowerCase()} articles and exercises from Intuisity.`); }
function articleDropdown(articles) { return articles?.length ? `<details class="article-menu"><summary>Article Guides</summary><div class="article-menu-list"><a href="/articles">All articles</a>${articles.map((article) => `<a href="/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a>`).join("")}</div></details>` : '<a href="/articles">Articles</a>'; }
function activityDropdown() { return `<details class="article-menu"><summary>Free Activities</summary><div class="article-menu-list">${Object.entries(landingPages).map(([path, page]) => `<a href="/${path}">${escapeHtml(page.title)}</a>`).join("")}</div></details>`; }
function layout({ title, description, canonical = "https://www.intuisity.com/articles", structuredData = "", navArticles = [], content }) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeAttribute(description)}"><link rel="canonical" href="${escapeAttribute(canonical)}"><link rel="icon" href="/favicon.ico">${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}<style>${pageStyles}${dropdownStyles}${landingStyles}</style></head><body><header><a href="/" class="brand">Intuisity</a><nav>${activityDropdown()}${articleDropdown(navArticles)}<a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="/">Open Intuisity</a></nav></header>${content}<footer>© ${new Date().getFullYear()} Intuisity · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></footer></body></html>`; }
function sendPage(response, status, html) { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.setHeader("Cache-Control", "public, max-age=0, s-maxage=300"); response.status(status).send(html); }
function cleanSlug(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
function escapeAttribute(value) { return escapeHtml(value); }
function escapeXml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character])); }
function formatDate(value) { const date = new Date(value || Date.now()); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Los_Angeles" }); }
const pageStyles = `*{box-sizing:border-box}body{margin:0;background:#fbfaff;color:#30264c;font-family:Arial,sans-serif;line-height:1.7}header{align-items:center;background:#fff;border-bottom:1px solid #e6def5;display:flex;justify-content:space-between;padding:16px max(20px,calc((100% - 960px)/2))}.brand{color:#6544b8;font-size:24px;font-weight:900;text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:16px}a{color:#6544b8;font-weight:700}main{margin:0 auto;max-width:900px;padding:48px 20px}h1{font-size:clamp(34px,6vw,56px);line-height:1.1;margin:8px 0 18px}h2{line-height:1.25}.eyebrow{color:#008a94;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.intro{font-size:20px}.meta,.breadcrumbs{color:#706982;font-size:14px}.grid{display:grid;gap:18px;margin-top:24px}.categories{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.card,.category-card,.practice{background:#fff;border:1px solid #dccff5;border-radius:12px;padding:24px}.card h2,.category-card h2{margin:4px 0}.read,.cta{display:inline-block;margin-top:8px}.cta{background:#6544b8;border-radius:8px;color:#fff;padding:12px 18px;text-decoration:none}.article-body{font-size:18px;margin:34px 0}.article-body h2{margin-top:34px}.practice{background:#f0eafa;margin:38px 0}.practice h2{margin-top:0}.related,.section-title{margin-top:46px}footer{border-top:1px solid #e6def5;margin-top:32px;padding:28px;text-align:center}@media(max-width:620px){header{align-items:flex-start;flex-direction:column;gap:10px}nav{gap:10px}main{padding-top:32px}}`;
const dropdownStyles = `nav{align-items:center}.article-menu{position:relative}.article-menu summary{color:#6544b8;cursor:pointer;font-weight:700;list-style:none}.article-menu summary::-webkit-details-marker{display:none}.article-menu summary:after{content:" ▾"}.article-menu[open] summary:after{content:" ▴"}.article-menu-list{background:#fff;border:1px solid #dccff5;border-radius:10px;box-shadow:0 10px 28px rgba(48,38,76,.16);display:grid;gap:2px;min-width:310px;padding:8px;position:absolute;right:0;top:34px;z-index:10}.article-menu-list a{border-radius:7px;line-height:1.35;padding:10px 12px;text-decoration:none}.article-menu-list a:hover,.article-menu-list a:focus{background:#f0eafa}@media(max-width:620px){nav{align-items:flex-start}.article-menu-list{left:0;max-width:calc(100vw - 40px);min-width:280px;right:auto}}`;
const landingStyles = `.primary-cta{font-size:18px;margin-top:16px}.free-note{color:#706982;font-size:14px;font-weight:700}.landing-sections{margin-top:42px}.landing-sections section{border-bottom:1px solid #e6def5;padding:16px 0}.faq{margin-top:42px}.faq details{background:#fff;border:1px solid #dccff5;border-radius:10px;margin:10px 0;padding:14px 18px}.faq summary{color:#493582;cursor:pointer;font-weight:800}.faq details p{margin-bottom:4px}.final-cta{background:#30264c;border-radius:14px;color:#fff;margin-top:42px;padding:28px}.final-cta h2{margin-top:0}.final-cta .cta{background:#fff;color:#493582}`;
