const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const legal = path.join(root, "legal");
const articles = path.join(root, "articles");
const publicDir = path.join(root, "public");
const brandingDir = path.join(publicDir, "branding");
const previewImageSource = path.join(publicDir, "intuisity-preview.png");
const previewImageFile = "intuisity-preview.png";
const previewImageUrl = `https://www.intuisity.com/${previewImageFile}`;

const pages = [
  { from: path.join(legal, "privacy.html"), to: path.join(dist, "privacy.html") },
  { from: path.join(legal, "terms.html"), to: path.join(dist, "terms.html") },
  { from: path.join(root, "sitemap.xml"), to: path.join(dist, "sitemap.xml") },
  { from: path.join(root, "robots.txt"), to: path.join(dist, "robots.txt") },
  { from: path.join(root, "llms.txt"), to: path.join(dist, "llms.txt") },
  { from: path.join(root, "intuition-training.html"), to: path.join(dist, "intuition-training.html") },
  { from: path.join(root, "intuition-games-with-friends.html"), to: path.join(dist, "intuition-games-with-friends.html") },
  { from: path.join(root, "remote-viewing-practice.html"), to: path.join(dist, "remote-viewing-practice.html") }
];

const seoTitle = "Intuisity | Daily Intuition Training, Astrology Insights, and Remote Viewing";
const seoDescription =
  "Intuisity is a free daily intuition training app for awareness, mindfulness, synchronicity, inner wisdom, remote viewing, manifestation, astrology insights, personal growth, spiritual awakening, and self-discovery.";
const seoKeywords = [
  "intuition training",
  "daily intuition games",
  "awareness practice",
  "mindfulness app",
  "sixth sense",
  "synchronicity",
  "inner wisdom",
  "inner knowing",
  "remote viewing",
  "astrology insights",
  "manifestation",
  "personal growth",
  "spiritual awakening",
  "self-discovery",
  "consciousness",
  "psychic development",
  "Treasure Chest friend challenge"
].join(", ");

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.intuisity.com/#organization",
      name: "Intuisity",
      url: "https://www.intuisity.com/",
      logo: "https://www.intuisity.com/branding/intuisity-logo-gold-transparent.png",
      image: "https://www.intuisity.com/intuisity-preview.png",
      description: seoDescription,
      sameAs: [
        "https://intuisity.com/",
        "https://www.intuisity.com/"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.intuisity.com/#website",
      name: "Intuisity",
      alternateName: "Intuisity Intuition Training",
      url: "https://www.intuisity.com/",
      description: seoDescription,
      publisher: { "@id": "https://www.intuisity.com/#organization" },
      inLanguage: "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.intuisity.com/#app",
      name: "Intuisity",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, iOS",
      url: "https://www.intuisity.com/",
      description: seoDescription,
      publisher: { "@id": "https://www.intuisity.com/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      featureList: [
        "Daily intuition training",
        "Treasure Chest friend challenges",
        "Remote viewing practice",
        "Daily astrology insights",
        "Mindfulness and awareness prompts",
        "Personal growth and self-discovery results"
      ]
    }
  ]
};

const noscriptContent = `
      <section>
        <h1>Intuisity: Awaken Your Intuition</h1>
        <p>Intuisity is a free daily intuition training platform for people exploring awareness, insight, consciousness, mindfulness, synchronicity, inner wisdom, inner knowing, personal growth, spiritual awakening, self-discovery, remote viewing, manifestation, and astrology insights.</p>
        <h2>Daily Intuition Challenges</h2>
        <p>Practice with six guided modules: Treasure Chest friend challenges, Train Your Knowing, Positivity Practice, Read the Person, Daily Astrology Tips, and Remote Viewing Challenge.</p>
        <h2>Free Intuition Building Games</h2>
        <p>Use daily games, reflection prompts, friend challenges, hidden picture exercises, birth chart guidance, and progress results to notice patterns, strengthen calm decision-making, and explore your natural sixth sense.</p>
        <h2>Build Awareness and Inner Wisdom</h2>
        <p>Each practice is designed for gentle self-discovery: quiet your mind, notice your first impression, compare results, and learn which kinds of intuitive signals feel calm, immediate, and repeatable. Intuisity supports personal growth through playful exercises for mindfulness, manifestation, synchronicity recognition, and remote viewing.</p>
        <h2>Practice Intuition With Feedback</h2>
        <p>Intuisity helps make intuition practice practical by pairing simple daily prompts with results, reflection, and feedback. Users can play a quick challenge, compare impressions with outcomes, notice which modules feel natural, and return each day for a grounded awareness practice.</p>
      </section>
    `;

const seoFallbackContent = `
    <main id="intuisity-seo-summary">
      <h1>Intuisity: Daily Intuition Training, Astrology Insights, and Remote Viewing</h1>
      <p>Intuisity is a free daily intuition training app for awareness, mindfulness, synchronicity, inner wisdom, inner knowing, personal growth, spiritual awakening, manifestation, self-discovery, and sixth sense development.</p>
      <p>Use Intuisity to practice six guided daily challenges: Treasure Chest friend challenges, Train Your Knowing hidden picture games, Positivity Practice, Read the Person, Daily Astrology Tips, and Remote Viewing Challenge.</p>
      <p>The Treasure Chest friend game lets users send a playful intuition challenge and secret note to a friend. Train Your Knowing helps users sense which colored square hides a beautiful picture. Remote Viewing encourages users to draw first impressions before choosing between images. Astrology guidance offers daily chart-based reflection. Positivity Practice gives gentle real-world ideas to build awareness and mindfulness. Results tracking helps users notice apparent strengths over time.</p>
      <p>Intuisity is built for people interested in intuition development, consciousness, insight, spiritual awakening, remote viewing, astrology, manifestation, mindfulness, and personal growth through free daily practice.</p>
      <p>Daily practice can include choosing a hidden picture, sending a Treasure Chest friend challenge, answering a birth-chart reflection, reading a portrait through first impressions, completing a tangible positivity task, or reviewing results to see how awareness changes over time.</p>
      <p>People use Intuisity to explore intuition in a grounded way: short exercises, calm attention, real feedback, and simple progress tracking instead of pressure or perfection.</p>
    </main>
  `;

if (!fs.existsSync(dist)) {
  throw new Error("dist folder was not found. Run the Expo web export before copying legal pages.");
}

for (const page of pages) {
  fs.copyFileSync(page.from, page.to);
}

function copyDirectory(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(source, target);
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

copyDirectory(brandingDir, path.join(dist, "branding"));
copyDirectory(articles, path.join(dist, "articles"));
for (const favicon of ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"]) {
  const source = path.join(publicDir, favicon);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dist, favicon));
}

if (fs.existsSync(previewImageSource)) {
  fs.copyFileSync(previewImageSource, path.join(dist, previewImageFile));
}

const indexPath = path.join(dist, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");

const seoHead = [
  `<title>${seoTitle}</title>`,
  `<meta name="description" content="${seoDescription}" />`,
  `<meta name="keywords" content="${seoKeywords}" />`,
  `<meta name="robots" content="index, follow" />`,
  `<link rel="canonical" href="https://www.intuisity.com/" />`,
  `<link rel="icon" href="/favicon.ico" sizes="any" />`,
  `<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />`,
  `<link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />`,
  `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
  `<meta property="og:title" content="Intuisity | Awaken Your Intuition. Expand Your Awareness." />`,
  `<meta property="og:description" content="${seoDescription}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="https://www.intuisity.com/" />`,
  `<meta property="og:image" content="${previewImageUrl}" />`,
  `<meta property="og:image:secure_url" content="${previewImageUrl}" />`,
  `<meta property="og:image:type" content="image/png" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:image:alt" content="Intuisity intuition training front page with gold logo and sunlit forest stream" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="Intuisity | Awaken Your Intuition" />`,
  `<meta name="twitter:description" content="${seoDescription}" />`,
  `<meta name="twitter:image" content="${previewImageUrl}" />`,
  `<style>:root{--intu-purple-950:#2e126f;--intu-purple-900:#3f1b91;--intu-purple-800:#5126ad;--intu-purple-700:#6537c7;--intu-purple-600:#7548d6;--intu-purple-500:#8659e5;--intu-gold-dark:#b87908;--intu-gold:#d79b16;--intu-gold-light:#f3c64d;--intu-gold-pale:#fff4cf;--intu-teal:#19aeb4;--intu-teal-light:#dff8f8;--intu-ink:#211842;--intu-muted:#6f6881;--intu-border:#e2dff0;--intu-surface:#ffffff;--intu-surface-soft:#faf8ff;}</style>`,
  `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
].join("\n    ");

indexHtml = indexHtml.replace(/<title>.*?<\/title>/, seoHead);
indexHtml = indexHtml.replace('<div id="root"></div>', `<div id="root">${seoFallbackContent}</div>`);
indexHtml = indexHtml.replace(
  /<noscript>[\s\S]*?<\/noscript>/,
  `<noscript>${noscriptContent}</noscript>`
);

fs.writeFileSync(indexPath, indexHtml);

const treasurePreviewTitle = "You Have an Intuisity Treasure Chest Challenge";
const treasurePreviewDescription =
  "A friend invited you to play a free Intuisity intuition challenge. Open the Treasure Chest, trust your first impression, and send a note back.";
const treasurePreviewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${treasurePreviewTitle}</title>
    <meta name="description" content="${treasurePreviewDescription}" />
    <meta name="robots" content="noindex, follow" />
    <meta property="og:title" content="${treasurePreviewTitle}" />
    <meta property="og:description" content="${treasurePreviewDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.intuisity.com/treasure-chest.html" />
    <meta property="og:image" content="${previewImageUrl}" />
    <meta property="og:image:secure_url" content="${previewImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Intuisity Treasure Chest friend challenge preview" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${treasurePreviewTitle}" />
    <meta name="twitter:description" content="${treasurePreviewDescription}" />
    <meta name="twitter:image" content="${previewImageUrl}" />
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f7f5ff; color: #30264c; }
      main { max-width: 760px; margin: 0 auto; padding: 32px 20px; text-align: center; }
      img { border-radius: 10px; max-width: 100%; }
      a { background: #6544b8; border-radius: 8px; color: #fff; display: inline-block; font-weight: 700; margin-top: 18px; padding: 12px 18px; text-decoration: none; }
    </style>
    <script>
      (function () {
        var query = window.location.search || "";
        window.location.replace("/" + query);
      }());
    </script>
  </head>
  <body>
    <main>
      <img src="/${previewImageFile}" alt="Intuisity intuition training preview" />
      <h1>${treasurePreviewTitle}</h1>
      <p>${treasurePreviewDescription}</p>
      <a href="/">Open Intuisity</a>
    </main>
  </body>
</html>
`;

fs.writeFileSync(path.join(dist, "treasure-chest.html"), treasurePreviewHtml);
