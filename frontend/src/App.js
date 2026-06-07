import React, { useState, useRef, useCallback } from "react";

// ── Icons (inline SVG to avoid deps) ─────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  youtube: "M19.59 6.69a4.83 4.83 0 01-3.77-2.7A12.94 12.94 0 0012 3.5a12.94 12.94 0 00-3.82.49 4.83 4.83 0 01-3.77 2.7A12.83 12.83 0 003 12a12.83 12.83 0 001.41 5.31 4.83 4.83 0 013.77 2.7A12.94 12.94 0 0012 20.5a12.94 12.94 0 003.82-.49 4.83 4.83 0 013.77-2.7A12.83 12.83 0 0021 12a12.83 12.83 0 00-1.41-5.31zM10 15V9l5 3-5 3z",
  tiktok: "M19.59 6.69a4.83 4.83 0 01-3.77-2.7A12.94 12.94 0 0012 3.5M9 3v13a3 3 0 003 3 3 3 0 003-3V7a7 7 0 007 7",
  twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  play: "M5 3l14 9-14 9V3z",
  photo: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  reel: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  clock: "M12 2a10 10 0 110 20A10 10 0 0112 2zm0 4v6l4 2",
  film: "M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z",
  x: "M18 6L6 18M6 6l12 12",
  paste: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  loader: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  check: "M20 6L9 17l-5-5",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
};

// ── Platform config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c", iconKey: "instagram" },
  { id: "tiktok", label: "TikTok", color: "#69c9d0", iconKey: "tiktok" },
  { id: "youtube", label: "YouTube", color: "#ff4444", iconKey: "youtube" },
  { id: "twitter", label: "Twitter/X", color: "#1da1f2", iconKey: "twitter" },
];

function formatBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCount(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

// ── Styles object ──────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 1rem 4rem",
  },
  header: {
    width: "100%",
    maxWidth: 660,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "2rem 0 1.5rem",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: "var(--grad-ig)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  logoBadge: {
    fontSize: 11,
    color: "var(--text-muted)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    padding: "2px 8px",
    borderRadius: 999,
  },
  main: {
    width: "100%",
    maxWidth: 660,
  },
  heroText: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  heroTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-1px",
    marginBottom: 12,
  },
  heroGrad: {
    background: "var(--grad-ig)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    color: "var(--text-secondary)",
    fontSize: 15,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "1.5rem",
    marginBottom: "1rem",
  },
  urlInput: {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    color: "var(--text-primary)",
    fontSize: 14,
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  btnRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  btnPaste: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  btnFetch: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 24px",
    background: "var(--grad-ig)",
    border: "none",
    borderRadius: "var(--radius-md)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  platformTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  tab: (active, color) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: `1px solid ${active ? color : "var(--border)"}`,
    background: active ? `${color}22` : "transparent",
    color: active ? color : "var(--text-secondary)",
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
  }),
  optRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid var(--border)",
  },
  optGroup: {
    flex: 1,
    minWidth: 120,
  },
  optLabel: {
    fontSize: 11,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 500,
    marginBottom: 6,
  },
  optSelect: {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    outline: "none",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0 0",
  },
  toggleLabel: {
    fontSize: 13,
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "14px 16px",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: "var(--radius-md)",
    color: "#ff8888",
    fontSize: 13,
    marginBottom: "1rem",
  },
  resultCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  resultThumb: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    background: "var(--bg-elevated)",
    display: "block",
  },
  resultThumbPlaceholder: {
    width: "100%",
    height: 200,
    background: "var(--bg-elevated)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 8,
    color: "var(--text-muted)",
  },
  resultBody: {
    padding: "1.25rem 1.5rem",
  },
  resultTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 8,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metaRow: {
    display: "flex",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  formatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 8,
  },
  formatBtn: (downloading) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: downloading ? "rgba(225,48,108,0.1)" : "var(--bg-elevated)",
    border: `1px solid ${downloading ? "rgba(225,48,108,0.3)" : "var(--border)"}`,
    borderRadius: "var(--radius-md)",
    color: downloading ? "#e1306c" : "var(--text-primary)",
    fontSize: 13,
    cursor: downloading ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
    textAlign: "left",
    width: "100%",
  }),
  fmtLabel: {
    flex: 1,
    fontWeight: 500,
  },
  fmtQuality: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  divider: {
    height: 1,
    background: "var(--border)",
    margin: "1.5rem 0",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 12,
  },
  footer: {
    marginTop: "3rem",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 12,
  },
};

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        background: checked ? "var(--accent-ig)" : "var(--bg-elevated)",
        border: "1px solid var(--border)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          top: 2,
          left: checked ? 20 : 2,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [audioOnly, setAudioOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const inputRef = useRef(null);

  const platformColor = PLATFORMS.find((p) => p.id === platform)?.color || "#e1306c";

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleFetch = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`https://grabmedia.onrender.com/api/info?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch info");
      setInfo(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleDownload = useCallback(async (formatId = null, forceAudio = false) => {
    const key = formatId || (forceAudio ? "audio" : "best");
    setDownloading(key);
    try {
      const res = await fetch("https://grabmedia.onrender.com/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), format_id: formatId, audio_only: forceAudio || audioOnly }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Download failed");
      }
      const blob = await res.blob();
      const contentDisp = res.headers.get("Content-Disposition") || "";
      const match = contentDisp.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `grabmedia.${forceAudio ? "mp3" : "mp4"}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(null);
    }
  }, [url, audioOnly]);

  const hasVideo = info?.formats?.some((f) => f.vcodec && f.vcodec !== "none");
  const hasAudio = info?.formats?.some((f) => f.acodec && f.acodec !== "none");

  return (
    <div style={S.app}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <Icon d={ICONS.film} size={22} color="#fff" />
          </div>
          <span style={S.logoText}>GrabMedia</span>
        </div>
        <span style={S.logoBadge}>v1.0 · yt-dlp powered</span>
      </header>

      <main style={S.main}>
        {/* Hero */}
        <div style={S.heroText}>
          <h1 style={S.heroTitle}>
            Download any <span style={S.heroGrad}>social media</span> video
          </h1>
          <p style={S.heroSub}>
            Instagram · TikTok · YouTube · Twitter/X — posts, reels, stories, shorts
          </p>
        </div>

        {/* URL Input Card */}
        <div style={S.card}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL from Instagram, TikTok, YouTube, or Twitter…"
            style={S.urlInput}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            onFocus={(e) => (e.target.style.borderColor = platformColor)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={S.btnRow}>
            <button style={S.btnPaste} onClick={handlePaste}>
              <Icon d={ICONS.paste} size={15} />
              Paste
            </button>
            <button
              style={{ ...S.btnFetch, opacity: loading ? 0.7 : 1 }}
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon d={ICONS.loader} size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Fetching…
                </>
              ) : (
                <>
                  <Icon d={ICONS.link} size={16} />
                  Fetch Media
                </>
              )}
            </button>
          </div>

          {/* Platform tabs */}
          <div style={{ ...S.platformTabs, marginTop: 16, marginBottom: 0 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                style={S.tab(platform === p.id, p.color)}
                onClick={() => setPlatform(p.id)}
              >
                <Icon d={ICONS[p.iconKey]} size={14} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Options */}
          <div style={S.optRow}>
            <div style={S.toggleRow}>
              <span style={S.toggleLabel}>
                <Icon d={ICONS.music} size={15} />
                Audio only (MP3)
              </span>
              <Toggle checked={audioOnly} onChange={setAudioOnly} />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={S.errorBox}>
            <Icon d={ICONS.alert} size={16} color="#ff8888" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {info && (
          <div style={S.resultCard}>
            {info.thumbnail ? (
              <img src={info.thumbnail} alt="Thumbnail" style={S.resultThumb} />
            ) : (
              <div style={S.resultThumbPlaceholder}>
                <Icon d={ICONS.photo} size={36} />
                <span style={{ fontSize: 13 }}>No preview available</span>
              </div>
            )}
            <div style={S.resultBody}>
              <div style={S.resultTitle} title={info.title}>{info.title}</div>
              <div style={S.metaRow}>
                {info.uploader && (
                  <span style={S.metaItem}>
                    <Icon d={ICONS.instagram} size={13} />
                    {info.uploader}
                  </span>
                )}
                {info.duration && (
                  <span style={S.metaItem}>
                    <Icon d={ICONS.clock} size={13} />
                    {formatDuration(info.duration)}
                  </span>
                )}
                {info.view_count && (
                  <span style={S.metaItem}>
                    <Icon d={ICONS.eye} size={13} />
                    {formatCount(info.view_count)} views
                  </span>
                )}
                {info.like_count && (
                  <span style={S.metaItem}>
                    <Icon d={ICONS.heart} size={13} />
                    {formatCount(info.like_count)}
                  </span>
                )}
                <span style={{ ...S.metaItem, textTransform: "capitalize", color: platformColor }}>
                  {info.platform}
                </span>
              </div>

              {/* Quick download buttons */}
              <div style={{ marginBottom: 16 }}>
                <div style={S.sectionTitle}>Quick Download</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hasVideo && (
                    <button
                      style={{
                        ...S.formatBtn(downloading === "best"),
                        background: "var(--grad-ig)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        flex: 1,
                        justifyContent: "center",
                      }}
                      onClick={() => handleDownload(null, false)}
                      disabled={!!downloading}
                    >
                      {downloading === "best" ? (
                        <Icon d={ICONS.loader} size={15} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Icon d={ICONS.download} size={15} />
                      )}
                      Best Quality MP4
                    </button>
                  )}
                  {hasAudio && (
                    <button
                      style={{ ...S.formatBtn(downloading === "audio"), flex: 1, justifyContent: "center" }}
                      onClick={() => handleDownload(null, true)}
                      disabled={!!downloading}
                    >
                      {downloading === "audio" ? (
                        <Icon d={ICONS.loader} size={15} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Icon d={ICONS.music} size={15} />
                      )}
                      MP3 Audio
                    </button>
                  )}
                </div>
              </div>

              {/* All formats */}
              {info.formats && info.formats.length > 0 && (
                <>
                  <div style={S.sectionTitle}>All Formats</div>
                  <div style={S.formatsGrid}>
                    {info.formats.map((fmt) => (
                      <button
                        key={fmt.format_id}
                        style={S.formatBtn(downloading === fmt.format_id)}
                        onClick={() => handleDownload(fmt.format_id, false)}
                        disabled={!!downloading}
                      >
                        <Icon
                          d={fmt.vcodec && fmt.vcodec !== "none" ? ICONS.reel : ICONS.music}
                          size={14}
                          color={downloading === fmt.format_id ? "#e1306c" : "var(--text-muted)"}
                        />
                        <span style={S.fmtLabel}>{fmt.quality || fmt.ext}</span>
                        <span style={S.fmtQuality}>
                          {fmt.ext?.toUpperCase()}
                          {fmt.filesize ? ` · ${formatBytes(fmt.filesize)}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Supported platforms */}
        {!info && !loading && (
          <div style={{ ...S.card, marginTop: "1rem" }}>
            <div style={S.sectionTitle}>Supported Platforms</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { name: "Instagram", desc: "Posts, Reels, Stories, IGTV", icon: "instagram", color: "#e1306c" },
                { name: "TikTok", desc: "Videos, without watermark", icon: "tiktok", color: "#69c9d0" },
                { name: "YouTube", desc: "Videos, Shorts, Music", icon: "youtube", color: "#ff4444" },
                { name: "Twitter/X", desc: "Videos, GIFs", icon: "twitter", color: "#1da1f2" },
              ].map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Icon d={ICONS[p.icon]} size={18} color={p.color} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={S.footer}>
        <p>GrabMedia · Personal use only · Respect copyright & platform terms of service</p>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.85; }
        input[type=url]::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
