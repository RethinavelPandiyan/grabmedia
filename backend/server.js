const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 5000;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "1ac290f871msh1a1eb3b307fa82ep186593jsnd32d7d45ac84";

app.use(helmet());
app.use(cors({ origin: "*" }));
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait." },
});
app.use("/api/", limiter);

function detectPlatform(url) {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return "unknown";
}

function rapidRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Invalid response")); }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Instagram info
async function getInstagramInfo(url) {
  const options = {
    method: "GET",
    hostname: "instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com",
    path: `/scraper?url=${encodeURIComponent(url)}`,
    headers: {
      "x-rapidapi-host": "instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com",
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  };
  const data = await rapidRequest(options);
  console.log("Instagram API response:", JSON.stringify(data).slice(0, 500));
  if (!data || data.error) throw new Error(data?.error || "Failed");

  return {
    title: data?.title || data?.caption || "Instagram Media",
    thumbnail: data?.thumbnail || data?.cover || data?.image || null,
    duration: data?.duration || null,
    uploader: data?.author || data?.username || null,
    view_count: null,
    like_count: null,
    platform: "instagram",
    directUrl: data?.url || data?.video_url || data?.download_url || null,
    formats: [
      { format_id: "video", ext: "mp4", quality: "Best", resolution: null, filesize: null, vcodec: "h264", acodec: "aac" }
    ],
  };
}

app.get("/api/info", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url query param required" });

  const platform = detectPlatform(url);

  try {
    if (platform === "instagram") {
      const info = await getInstagramInfo(url);
      return res.json(info);
    }
    return res.status(400).json({ error: "Only Instagram is supported right now." });
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Could not fetch media info. The URL may be private or unsupported." });
  }
});

app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  const platform = detectPlatform(url);

  try {
    let directUrl = null;

    if (platform === "instagram") {
      const info = await getInstagramInfo(url);
      directUrl = info.directUrl;
    }

    if (!directUrl) return res.status(500).json({ error: "Could not get download URL." });

    // Redirect to direct URL
    res.redirect(directUrl);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Download failed." });
  }
});

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "2.0.0" }));

app.listen(PORT, () => {
  console.log(`🚀 GrabMedia backend running on http://localhost:${PORT}`);
});