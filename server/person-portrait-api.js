const allowedImageHosts = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org"
]);

module.exports = async function personPortraitApi(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const title = String(request.query?.title || "").trim().slice(0, 160);
  if (!title) return response.status(400).json({ error: "A person title is required" });

  try {
    const query = new URLSearchParams({
      action: "query",
      format: "json",
      piprop: "thumbnail",
      pithumbsize: "900",
      prop: "pageimages",
      redirects: "1",
      titles: title
    });
    const metadataResponse = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, {
      headers: { "User-Agent": "Intuisity/1.0 (https://www.intuisity.com)" }
    });
    if (!metadataResponse.ok) return response.status(404).json({ error: "Portrait not found" });

    const metadata = await metadataResponse.json();
    const page = Object.values(metadata?.query?.pages || {})[0];
    const source = page?.thumbnail?.source;
    if (!source) return response.status(404).json({ error: "Portrait not found" });

    const imageUrl = new URL(source.startsWith("//") ? `https:${source}` : source);
    if (imageUrl.protocol !== "https:" || !allowedImageHosts.has(imageUrl.hostname)) {
      return response.status(400).json({ error: "Unsupported portrait host" });
    }

    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "Intuisity/1.0 (https://www.intuisity.com)" }
    });
    if (!imageResponse.ok) return response.status(404).json({ error: "Portrait not found" });

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return response.status(502).json({ error: "Invalid portrait response" });
    }
    const image = Buffer.from(await imageResponse.arrayBuffer());
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    return response.status(200).send(image);
  } catch {
    return response.status(502).json({ error: "Portrait could not be loaded" });
  }
};
