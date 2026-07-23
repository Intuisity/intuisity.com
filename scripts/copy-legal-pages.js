const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const legal = path.join(root, "legal");

const pages = [
  { from: path.join(legal, "privacy.html"), to: path.join(dist, "privacy.html") },
  { from: path.join(legal, "terms.html"), to: path.join(dist, "terms.html") },
  { from: path.join(root, "sitemap.xml"), to: path.join(dist, "sitemap.xml") },
  { from: path.join(root, "robots.txt"), to: path.join(dist, "robots.txt") },
  { from: path.join(root, "llms.txt"), to: path.join(dist, "llms.txt") }
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
  "@type": "SoftwareApplication",
  name: "Intuisity",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, iOS",
  url: "https://www.intuisity.com/",
  description: seoDescription,
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
      </section>
    `;

const seoFallbackContent = `
    <main id="intuisity-seo-summary">
      <h1>Intuisity: Daily Intuition Training, Astrology Insights, and Remote Viewing</h1>
      <p>Intuisity is a free daily intuition training app for awareness, mindfulness, synchronicity, inner wisdom, inner knowing, personal growth, spiritual awakening, manifestation, self-discovery, and sixth sense development.</p>
      <p>Use Intuisity to practice six guided daily challenges: Treasure Chest friend challenges, Train Your Knowing hidden picture games, Positivity Practice, Read the Person, Daily Astrology Tips, and Remote Viewing Challenge.</p>
      <p>The Treasure Chest friend game lets users send a playful intuition challenge and secret note to a friend. Train Your Knowing helps users sense which colored square hides a beautiful picture. Remote Viewing encourages users to draw first impressions before choosing between images. Astrology guidance offers daily chart-based reflection. Positivity Practice gives gentle real-world ideas to build awareness and mindfulness. Results tracking helps users notice apparent strengths over time.</p>
      <p>Intuisity is built for people interested in intuition development, consciousness, insight, spiritual awakening, remote viewing, astrology, manifestation, mindfulness, and personal growth through free daily practice.</p>
    </main>
  `;

if (!fs.existsSync(dist)) {
  throw new Error("dist folder was not found. Run the Expo web export before copying legal pages.");
}

for (const page of pages) {
  fs.copyFileSync(page.from, page.to);
}

const indexPath = path.join(dist, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");

const seoHead = [
  `<title>${seoTitle}</title>`,
  `<meta name="description" content="${seoDescription}" />`,
  `<meta name="keywords" content="${seoKeywords}" />`,
  `<meta name="robots" content="index, follow" />`,
  `<link rel="canonical" href="https://www.intuisity.com/" />`,
  `<meta property="og:title" content="Intuisity | Awaken Your Intuition. Expand Your Awareness." />`,
  `<meta property="og:description" content="${seoDescription}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="https://www.intuisity.com/" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
].join("\n    ");

indexHtml = indexHtml.replace(/<title>.*?<\/title>/, seoHead);
indexHtml = indexHtml.replace('<div id="root"></div>', `<div id="root">${seoFallbackContent}</div>`);
indexHtml = indexHtml.replace(
  /<noscript>[\s\S]*?<\/noscript>/,
  `<noscript>${noscriptContent}</noscript>`
);

fs.writeFileSync(indexPath, indexHtml);
