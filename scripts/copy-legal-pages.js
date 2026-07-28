const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const legal = path.join(root, "legal");

const siteUrl = "https://www.intuisity.com/";
const title = "Intuisity | Daily Intuition Training & Awareness Games";
const description = "Build intuition, awareness, mindfulness, and pattern recognition with Intuisity's guided daily exercises, remote viewing practice, and interactive games.";
const shareImageUrl = `${siteUrl}intuisity-share.png`;

function injectHomePageSeo() {
  const indexPath = path.join(dist, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Intuisity",
        url: siteUrl
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Intuisity",
        description,
        publisher: { "@id": `${siteUrl}#organization` },
        inLanguage: "en-US"
      },
      {
        "@type": "SoftwareApplication",
        name: "Intuisity",
        url: siteUrl,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, iOS",
        description,
        image: shareImageUrl
      }
    ]
  };

  const seo = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`,
    `<link rel="canonical" href="${siteUrl}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Intuisity">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${siteUrl}">`,
    `<meta property="og:image" content="${shareImageUrl}">`,
    `<meta property="og:image:alt" content="Intuisity daily intuition training and awareness games">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${shareImageUrl}">`,
    `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
  ].join("\n    ");

  html = html
    .replace(/<title>.*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/i, "")
    .replace("</head>", `    ${seo}\n  </head>`);
  fs.writeFileSync(indexPath, html);
}

const pages = [
  { from: path.join(legal, "privacy.html"), to: path.join(dist, "privacy.html") },
  { from: path.join(legal, "terms.html"), to: path.join(dist, "terms.html") },
  { from: path.join(legal, "faq.html"), to: path.join(dist, "faq.html") },
  { from: path.join(legal, "about.html"), to: path.join(dist, "about.html") },
  { from: path.join(legal, "intuition-training.html"), to: path.join(dist, "intuition-training.html") },
  { from: path.join(legal, "remote-viewing-practice.html"), to: path.join(dist, "remote-viewing-practice.html") },
  { from: path.join(legal, "friend-intuition-games.html"), to: path.join(dist, "friend-intuition-games.html") },
  { from: path.join(legal, "treasure-chest.html"), to: path.join(dist, "treasure-chest.html") },
  { from: path.join(legal, "llms.txt"), to: path.join(dist, "llms.txt") },
  { from: path.join(legal, "robots.txt"), to: path.join(dist, "robots.txt") },
  { from: path.join(legal, "sitemap.xml"), to: path.join(dist, "sitemap.xml") },
  { from: path.join(root, "assets", "intuisity-front-banner-v5.png"), to: path.join(dist, "intuisity-share.png") }
];

if (!fs.existsSync(dist)) {
  throw new Error("dist folder was not found. Run the Expo web export before copying legal pages.");
}

for (const page of pages) {
  fs.copyFileSync(page.from, page.to);
}

injectHomePageSeo();
