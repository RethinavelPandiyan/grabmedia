# GrabMedia — Social Media Downloader

Download Instagram posts, reels, stories, TikTok videos, YouTube videos, Shorts, and Twitter/X media.

**Stack:** Node.js + Express backend (yt-dlp) · React frontend

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **yt-dlp** — the backend will auto-download it on first run, OR install manually:

```bash
# macOS
brew install yt-dlp

# Linux
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Windows (winget)
winget install yt-dlp
```

- **ffmpeg** (required for merging video+audio, e.g. 1080p YouTube):

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows — https://ffmpeg.org/download.html (add to PATH)
```

---

## Quick Start

### 1. Clone / extract the project

```
grabmedia/
├── backend/
└── frontend/
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default port: 5000)
npm start
```

Backend runs at **http://localhost:5000**

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000** and proxies `/api/*` to the backend.

---

## API Reference

### GET `/api/info?url=<media_url>`
Fetches media metadata without downloading.

**Response:**
```json
{
  "title": "Video title",
  "thumbnail": "https://...",
  "duration": 42,
  "uploader": "@username",
  "view_count": 1200000,
  "platform": "instagram",
  "formats": [
    { "format_id": "22", "ext": "mp4", "quality": "720p", "filesize": 25600000 }
  ]
}
```

### POST `/api/download`
Downloads the file and streams it to the client.

**Request body:**
```json
{
  "url": "https://www.instagram.com/reel/...",
  "format_id": "22",      // optional — omit for best quality
  "audio_only": false     // true = extract MP3
}
```

### GET `/api/health`
Returns `{ "status": "ok" }`.

---

## Instagram Login (for private/story content)

Instagram requires login for Stories and some content. Export cookies from your browser:

1. Install **"Get cookies.txt LOCALLY"** Chrome extension
2. Go to instagram.com while logged in
3. Click the extension → Export cookies → save as `cookies.txt`
4. In `.env`, set: `INSTAGRAM_COOKIES_FILE=/absolute/path/to/cookies.txt`

---

## Production Deployment

### Build the frontend

```bash
cd frontend
npm run build
```

Then serve the `build/` folder from the backend:

```js
// Add to server.js before app.listen:
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../frontend/build/index.html')));
```

### Environment variables (production)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `INSTAGRAM_COOKIES_FILE` | _(none)_ | Path to Netscape cookies file |

---

## Supported Platforms

| Platform | Posts | Reels/Shorts | Stories | Audio |
|---|---|---|---|---|
| Instagram | ✅ | ✅ | ✅ (with cookies) | ✅ |
| TikTok | ✅ | ✅ | — | ✅ |
| YouTube | ✅ | ✅ (Shorts) | — | ✅ |
| Twitter/X | ✅ | — | — | ✅ |
| Facebook | ✅ | ✅ | — | ✅ |

> **Note:** Downloading copyrighted content may violate platform Terms of Service. Use for personal archival only.

---

## Troubleshooting

**"yt-dlp not found"** → Install yt-dlp manually (see Prerequisites).

**Instagram gives error** → Add cookies (see Instagram Login section above).

**No audio in downloaded video** → Install ffmpeg (see Prerequisites).

**Rate limit errors** → Wait 15 minutes; limit is 30 requests per IP per 15 min.
