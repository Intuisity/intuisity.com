const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const legal = path.join(root, "legal");

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
  { from: path.join(legal, "sitemap.xml"), to: path.join(dist, "sitemap.xml") }
];

if (!fs.existsSync(dist)) {
  throw new Error("dist folder was not found. Run the Expo web export before copying legal pages.");
}

for (const page of pages) {
  fs.copyFileSync(page.from, page.to);
}
