const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const YTDlpWrap = require("yt-dlp-wrap").default;

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many requests. Please wait a moment." },
});
app.use("/api/", limiter);

// ── Downloads folder ──────────────────────────────────────────────────────────
const DOWNLOADS_DIR = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

// ── yt-dlp setup ──────────────────────────────────────────────────────────────
// yt-dlp binary: either installed system-wide or downloaded automatically
const { execSync } = require("child_process");
const ytDlp = new YTDlpWrap();

// Auto-download yt-dlp binary if missing (first run)
async function ensureYtDlp() {
  try {
    execSync("pip3 install yt-dlp", { stdio: "inherit" });
    ytDlp.setBinaryPath("yt-dlp");
    console.log("✅ yt-dlp ready via pip");
  } catch (e) {
    console.error("❌ yt-dlp error:", e.message);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectPlatform(url) {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  return "unknown";
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, "_").slice(0, 80);
}

// Periodic cleanup: remove files older than 1 hour
function cleanOldFiles() {
  const now = Date.now();
  fs.readdirSync(DOWNLOADS_DIR).forEach((file) => {
    const fp = path.join(DOWNLOADS_DIR, file);
    const stat = fs.statSync(fp);
    if (now - stat.mtimeMs > 60 * 60 * 1000) fs.unlinkSync(fp);
  });
}
setInterval(cleanOldFiles, 10 * 60 * 1000);

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/info  →  fetch metadata without downloading
app.get("/api/info", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url query param required" });

  try {
    const info = await ytDlp.getVideoInfo(url);

    const formats = (info.formats || [])
      .filter((f) => f.ext && f.format_note)
      .map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.format_note,
        resolution: f.resolution || null,
        filesize: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
      }))
      // deduplicate by quality label
      .filter(
        (f, i, arr) => arr.findIndex((x) => x.quality === f.quality && x.ext === f.ext) === i
      )
      .slice(0, 12);

    res.json({
      title: info.title || "Untitled",
      thumbnail: info.thumbnail || null,
      duration: info.duration || null,
      uploader: info.uploader || info.channel || null,
      view_count: info.view_count || null,
      like_count: info.like_count || null,
      platform: detectPlatform(url),
      formats,
    });
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Could not fetch media info. The URL may be private or unsupported." });
  }
});

// POST /api/download  →  download and return file
app.post("/api/download", async (req, res) => {
  const { url, format_id, audio_only } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  const fileId = uuidv4();
  const outputTemplate = path.join(DOWNLOADS_DIR, `${fileId}.%(ext)s`);

  try {
    const ytArgs = [url, "-o", outputTemplate, "--no-playlist"];

    if (audio_only) {
      ytArgs.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    } else if (format_id) {
      ytArgs.push("-f", `${format_id}+bestaudio/best[ext=mp4]/best`);
    } else {
      ytArgs.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");
    }

    // merge into mp4 when possible
    if (!audio_only) {
      ytArgs.push("--merge-output-format", "mp4");
    }

    // Add cookies for Instagram if INSTAGRAM_COOKIES_FILE env is set
    if (process.env.INSTAGRAM_COOKIES_FILE && /instagram\.com/i.test(url)) {
      ytArgs.push("--cookies", process.env.INSTAGRAM_COOKIES_FILE);
    }

    await ytDlp.execPromise(ytArgs);

    // Find the output file
    const files = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(fileId));
    if (!files.length) return res.status(500).json({ error: "Download failed — file not found." });

    const filename = files[0];
    const filepath = path.join(DOWNLOADS_DIR, filename);
    const ext = path.extname(filename);
    const mimeMap = {
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
      ".webm": "video/webm",
      ".m4a": "audio/mp4",
    };
    const mime = mimeMap[ext] || "application/octet-stream";

    res.setHeader("Content-Disposition", `attachment; filename="grabmedia_${fileId}${ext}"`);
    res.setHeader("Content-Type", mime);
    const stat = fs.statSync(filepath);
    res.setHeader("Content-Length", stat.size);

    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
    stream.on("close", () => {
      // Delete after serving
      try { fs.unlinkSync(filepath); } catch {}
    });
  } catch (err) {
    console.error("Download error:", err.message);
    // Clean up any partial files
    fs.readdirSync(DOWNLOADS_DIR)
      .filter((f) => f.startsWith(fileId))
      .forEach((f) => { try { fs.unlinkSync(path.join(DOWNLOADS_DIR, f)); } catch {} });

    res.status(500).json({ error: "Download failed. The URL may be private, geo-blocked, or require login." });
  }
});

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", version: "1.0.0" }));

// ── Start ─────────────────────────────────────────────────────────────────────
ensureYtDlp().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 GrabMedia backend running on http://localhost:${PORT}`);
  });
});
