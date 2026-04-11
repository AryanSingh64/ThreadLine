"use client";

import { useMemo, useState } from "react";
import { generateVariations } from "@/lib/usernameVariations";
import GlassCard from "@/components/ui/GlassCard";

// ─── Platform icon & color mapping (covers 149+ platforms) ───────────
const PLATFORM_META = {
  GitHub: { icon: "🐙", color: "#f0f6ff", accent: "#7dd3fc", category: "Coding" },
  GitLab: { icon: "🦊", color: "#fdf2ff", accent: "#c084fc", category: "Coding" },
  Bitbucket: { icon: "🪣", color: "#eff6ff", accent: "#60a5fa", category: "Coding" },
  CodePen: { icon: "🖊️", color: "#f0fdf4", accent: "#4ade80", category: "Coding" },
  Replit: { icon: "⚡", color: "#fefce8", accent: "#fbbf24", category: "Coding" },
  "Stack Overflow": { icon: "📚", color: "#fff7ed", accent: "#fb923c", category: "Coding" },
  StackOverflow: { icon: "📚", color: "#fff7ed", accent: "#fb923c", category: "Coding" },
  "Dev.to": { icon: "📝", color: "#f8fafc", accent: "#94a3b8", category: "Coding" },
  Devto: { icon: "📝", color: "#f8fafc", accent: "#94a3b8", category: "Coding" },
  Hashnode: { icon: "🟦", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  "Hugging Face": { icon: "🤗", color: "#fdf2ff", accent: "#a78bfa", category: "Coding" },
  PyPI: { icon: "🐍", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  npm: { icon: "📦", color: "#fef2f2", accent: "#ef4444", category: "Coding" },
  "Docker Hub": { icon: "🐳", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  SourceForge: { icon: "🔧", color: "#f8fafc", accent: "#64748b", category: "Coding" },
  Gitea: { icon: "🐙", color: "#f0fdf4", accent: "#4ade80", category: "Coding" },
  Launchpad: { icon: "🚀", color: "#fefce8", accent: "#fbbf24", category: "Coding" },
  LeetCode: { icon: "💻", color: "#fefce8", accent: "#fbbf24", category: "Coding" },
  HackerRank: { icon: "🏆", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  Codeforces: { icon: "🔴", color: "#fef2f2", accent: "#ef4444", category: "Coding" },
  AtCoder: { icon: "🟡", color: "#fefce8", accent: "#eab308", category: "Coding" },
  TopCoder: { icon: "🏅", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  GeeksforGeeks: { icon: "🤓", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  Codecademy: { icon: "🎓", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  FreeCodeCamp: { icon: "🏕️", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  Kaggle: { icon: "📊", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  "Product Hunt": { icon: "🐱", color: "#fef2f2", accent: "#ef4444", category: "Coding" },
  ProductHunt: { icon: "🐱", color: "#fef2f2", accent: "#ef4444", category: "Coding" },
  CodeChef: { icon: "👨‍🍳", color: "#fff7ed", accent: "#fb923c", category: "Coding" },
  Codewars: { icon: "⚔️", color: "#fef2f2", accent: "#ef4444", category: "Coding" },
  Exercism: { icon: "🏋️", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  Codingame: { icon: "🎮", color: "#eff6ff", accent: "#3b82f6", category: "Coding" },
  HackerEarth: { icon: "🌍", color: "#f0fdf4", accent: "#22c55e", category: "Coding" },
  SPOJ: { icon: "🔢", color: "#f8fafc", accent: "#94a3b8", category: "Coding" },
  "Project Euler": { icon: "📐", color: "#fdf2ff", accent: "#a78bfa", category: "Coding" },

  Reddit: { icon: "🟠", color: "#fff7ed", accent: "#fb923c", category: "Social" },
  "X (Twitter)": { icon: "✖️", color: "#f8fafc", accent: "#94a3b8", category: "Social" },
  Instagram: { icon: "📸", color: "#fdf2ff", accent: "#e879f9", category: "Social" },
  Facebook: { icon: "📘", color: "#eff6ff", accent: "#3b82f6", category: "Social" },
  LinkedIn: { icon: "💼", color: "#eff6ff", accent: "#0ea5e9", category: "Social" },
  TikTok: { icon: "🎵", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  Pinterest: { icon: "📌", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  Threads: { icon: "🧵", color: "#f8fafc", accent: "#94a3b8", category: "Social" },
  Bluesky: { icon: "🦋", color: "#eff6ff", accent: "#3b82f6", category: "Social" },
  Mastodon: { icon: "🐘", color: "#fdf2ff", accent: "#a78bfa", category: "Social" },
  VK: { icon: "🔵", color: "#eff6ff", accent: "#3b82f6", category: "Social" },
  "OK.ru": { icon: "🟠", color: "#fff7ed", accent: "#fb923c", category: "Social" },
  Weibo: { icon: "👁️", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  Telegram: { icon: "✈️", color: "#eff6ff", accent: "#3b82f6", category: "Social" },
  Snapchat: { icon: "👻", color: "#fefce8", accent: "#eab308", category: "Social" },
  Discord: { icon: "🎮", color: "#ede9fe", accent: "#7c3aed", category: "Social" },
  "9GAG": { icon: "9️⃣", color: "#f8fafc", accent: "#94a3b8", category: "Social" },
  "We Heart It": { icon: "❤️", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  Mix: { icon: "🔀", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  Ello: { icon: "✌️", color: "#f8fafc", accent: "#94a3b8", category: "Social" },
  Gab: { icon: "💬", color: "#fefce8", accent: "#eab308", category: "Social" },
  Parler: { icon: "🗣️", color: "#fef2f2", accent: "#ef4444", category: "Social" },
  "Truth Social": { icon: "🗣️", color: "#eff6ff", accent: "#3b82f6", category: "Social" },
  Minds: { icon: "🧠", color: "#fff7ed", accent: "#fb923c", category: "Social" },

  YouTube: { icon: "▶️", color: "#fef2f2", accent: "#ef4444", category: "Video" },
  Twitch: { icon: "💜", color: "#ede9fe", accent: "#7c3aed", category: "Video" },
  Vimeo: { icon: "🎬", color: "#eff6ff", accent: "#3b82f6", category: "Video" },
  Rumble: { icon: "⚡", color: "#fefce8", accent: "#eab308", category: "Video" },
  Odysee: { icon: "👁️", color: "#fef2f2", accent: "#ef4444", category: "Video" },
  Kick: { icon: "🦵", color: "#f0fdf4", accent: "#22c55e", category: "Video" },
  Bilibili: { icon: "📺", color: "#eff6ff", accent: "#3b82f6", category: "Video" },
  "Nico Nico": { icon: "🎤", color: "#fdf2ff", accent: "#a78bfa", category: "Video" },
  Douyin: { icon: "🎵", color: "#fef2f2", accent: "#ef4444", category: "Video" },

  SoundCloud: { icon: "☁️", color: "#fff7ed", accent: "#fb923c", category: "Music" },
  Spotify: { icon: "🎵", color: "#f0fdf4", accent: "#22c55e", category: "Music" },
  Bandcamp: { icon: "🎸", color: "#eff6ff", accent: "#3b82f6", category: "Music" },
  Mixcloud: { icon: "📻", color: "#fef2f2", accent: "#ef4444", category: "Music" },
  "Last.fm": { icon: "🎶", color: "#fef2f2", accent: "#ef4444", category: "Music" },
  ReverbNation: { icon: "🎤", color: "#fef2f2", accent: "#ef4444", category: "Music" },

  Behance: { icon: "🅱️", color: "#eff6ff", accent: "#3b82f6", category: "Design" },
  Dribbble: { icon: "🏀", color: "#fef2f2", accent: "#ef4444", category: "Design" },
  DeviantArt: { icon: "🎨", color: "#f0fdf4", accent: "#22c55e", category: "Design" },
  Pixiv: { icon: "🖼️", color: "#eff6ff", accent: "#3b82f6", category: "Design" },
  Figma: { icon: "🎯", color: "#fdf2ff", accent: "#a78bfa", category: "Design" },
  Canva: { icon: "🎨", color: "#eff6ff", accent: "#3b82f6", category: "Design" },
  Unsplash: { icon: "📷", color: "#f8fafc", accent: "#94a3b8", category: "Design" },
  Flickr: { icon: "📸", color: "#fdf2ff", accent: "#a78bfa", category: "Design" },
  "500px": { icon: "📷", color: "#f8fafc", accent: "#94a3b8", category: "Design" },
  VSCO: { icon: "🎞️", color: "#f8fafc", accent: "#94a3b8", category: "Design" },
  Giphy: { icon: "🎞️", color: "#f0fdf4", accent: "#22c55e", category: "Design" },
  ArtStation: { icon: "🎨", color: "#eff6ff", accent: "#3b82f6", category: "Design" },
  EyeEm: { icon: "👁️", color: "#f8fafc", accent: "#94a3b8", category: "Design" },

  Steam: { icon: "🎮", color: "#1e3a5f", accent: "#60a5fa", category: "Gaming" },
  Roblox: { icon: "🧱", color: "#fef2f2", accent: "#ef4444", category: "Gaming" },
  "Chess.com": { icon: "♟️", color: "#f8fafc", accent: "#94a3b8", category: "Gaming" },
  Lichess: { icon: "♟️", color: "#f0fdf4", accent: "#22c55e", category: "Gaming" },
  "itch.io": { icon: "🎮", color: "#fef2f2", accent: "#ef4444", category: "Gaming" },
  PlayStation: { icon: "🎮", color: "#eff6ff", accent: "#3b82f6", category: "Gaming" },
  NexusMods: { icon: "🔧", color: "#f0fdf4", accent: "#22c55e", category: "Gaming" },
  GameBanana: { icon: "🍌", color: "#fefce8", accent: "#eab308", category: "Gaming" },
  "Speedrun.com": { icon: "⏱️", color: "#fff7ed", accent: "#fb923c", category: "Gaming" },
  "Unity Asset Store": { icon: "🎮", color: "#f8fafc", accent: "#94a3b8", category: "Gaming" },

  Medium: { icon: "✍️", color: "#f8fafc", accent: "#94a3b8", category: "Writing" },
  Wattpad: { icon: "📖", color: "#fef2f2", accent: "#ef4444", category: "Writing" },
  AO3: { icon: "📚", color: "#fef2f2", accent: "#ef4444", category: "Writing" },
  Goodreads: { icon: "📚", color: "#fff7ed", accent: "#fb923c", category: "Writing" },
  "Royal Road": { icon: "👑", color: "#fefce8", accent: "#eab308", category: "Writing" },
  ScribbleHub: { icon: "✏️", color: "#f0fdf4", accent: "#22c55e", category: "Writing" },
  Inkitt: { icon: "📝", color: "#fdf2ff", accent: "#a78bfa", category: "Writing" },
  Commaful: { icon: "📖", color: "#eff6ff", accent: "#3b82f6", category: "Writing" },
  "FanFiction.net": { icon: "📖", color: "#fff7ed", accent: "#fb923c", category: "Writing" },
  Substack: { icon: "📧", color: "#f8fafc", accent: "#94a3b8", category: "Writing" },
  Issuu: { icon: "📰", color: "#fef2f2", accent: "#ef4444", category: "Writing" },
  Flavorwire: { icon: "📰", color: "#fefce8", accent: "#eab308", category: "Writing" },

  OKCupid: { icon: "💕", color: "#fef2f2", accent: "#ef4444", category: "Dating" },
  Badoo: { icon: "💬", color: "#eff6ff", accent: "#3b82f6", category: "Dating" },
  Tagged: { icon: "🏷️", color: "#fefce8", accent: "#eab308", category: "Dating" },
  Zoosk: { icon: "💘", color: "#fef2f2", accent: "#ef4444", category: "Dating" },

  Strava: { icon: "🏃", color: "#fff7ed", accent: "#fb923c", category: "Fitness" },
  MyFitnessPal: { icon: "🥗", color: "#f0fdf4", accent: "#22c55e", category: "Fitness" },
  Fitocracy: { icon: "💪", color: "#fef2f2", accent: "#ef4444", category: "Fitness" },
  Zwift: { icon: "🚴", color: "#eff6ff", accent: "#3b82f6", category: "Fitness" },

  HackerOne: { icon: "🐛", color: "#f0fdf4", accent: "#22c55e", category: "Security" },
  Bugcrowd: { icon: "🎯", color: "#fff7ed", accent: "#fb923c", category: "Security" },

  Keybase: { icon: "🔑", color: "#f0fdf4", accent: "#4ade80", category: "Communication" },
  Line: { icon: "💬", color: "#f0fdf4", accent: "#22c55e", category: "Communication" },
  Signal: { icon: "📱", color: "#eff6ff", accent: "#3b82f6", category: "Communication" },
  Guilded: { icon: "🛡️", color: "#fefce8", accent: "#eab308", category: "Communication" },
  Matrix: { icon: "🔗", color: "#f8fafc", accent: "#94a3b8", category: "Communication" },

  Tripadvisor: { icon: "🌍", color: "#f0fdf4", accent: "#22c55e", category: "Lifestyle" },
  Trip: { icon: "✈️", color: "#eff6ff", accent: "#3b82f6", category: "Lifestyle" },
  Gravatar: { icon: "👤", color: "#f0fdf4", accent: "#22c55e", category: "Lifestyle" },
  IMDb: { icon: "🎬", color: "#fefce8", accent: "#eab308", category: "Lifestyle" },
  MyAnimeList: { icon: "🎌", color: "#fff7ed", accent: "#fb923c", category: "Lifestyle" },

  WordPress: { icon: "📝", color: "#eff6ff", accent: "#3b82f6", category: "Blogging" },
  Naver: { icon: "🟢", color: "#f0fdf4", accent: "#22c55e", category: "Blogging" },
  Daum: { icon: "📝", color: "#fefce8", accent: "#eab308", category: "Blogging" },

  AngelList: { icon: "👼", color: "#f8fafc", accent: "#94a3b8", category: "Business" },
  Crunchbase: { icon: "📊", color: "#eff6ff", accent: "#3b82f6", category: "Business" },
  ResearchGate: { icon: "🔬", color: "#f0fdf4", accent: "#22c55e", category: "Business" },
  ORCID: { icon: "🆔", color: "#f0fdf4", accent: "#22c55e", category: "Business" },

  Linktree: { icon: "🌳", color: "#f0fdf4", accent: "#22c55e", category: "Links" },
  Carrd: { icon: "🃏", color: "#fef2f2", accent: "#ef4444", category: "Links" },
  "About.me": { icon: "👤", color: "#eff6ff", accent: "#3b82f6", category: "Links" },
  Aboutme: { icon: "👤", color: "#eff6ff", accent: "#3b82f6", category: "Links" },
  BuyMeACoffee: { icon: "☕", color: "#fefce8", accent: "#eab308", category: "Links" },
  Patreon: { icon: "🎭", color: "#fef2f2", accent: "#ef4444", category: "Links" },

  Trello: { icon: "📋", color: "#eff6ff", accent: "#3b82f6", category: "Productivity" },
  Notion: { icon: "📓", color: "#f8fafc", accent: "#94a3b8", category: "Productivity" },
  Sourcehut: { icon: "🔧", color: "#f8fafc", accent: "#94a3b8", category: "Productivity" },
};

function getPlatformMeta(platformName) {
  if (PLATFORM_META[platformName]) return PLATFORM_META[platformName];
  const lower = platformName.toLowerCase();
  for (const [key, meta] of Object.entries(PLATFORM_META)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return meta;
  }
  return { icon: "🌐", color: "#f8fafc", accent: "#94a3b8", category: "Other" };
}

function relTime(t) {
  if (!t) return "";
  const diff = Date.now() - new Date(t).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(diff / 86400000);
  return `${d}d ago`;
}

function PlatformRow({ profile }) {
  const pm = getPlatformMeta(profile.platform);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 12px",
      borderRadius: "var(--radius-sm)",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: "4px",
      transition: "background 150ms ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <span style={{ fontSize: "1.1rem", width: "24px", textAlign: "center" }}>{pm.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {profile.platform}
        </p>
        <p className="type-micro" style={{ color: "var(--text-muted)" }}>
          {pm.category} · {profile.username}
        </p>
      </div>
      {profile.url && (
        <a href={profile.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: pm.accent,
            textDecoration: "none", border: `1px solid ${pm.accent}40`,
            borderRadius: "var(--radius-pill)", padding: "2px 8px", flexShrink: 0 }}>
          View ↗
        </a>
      )}
    </div>
  );
}

function VariationsWidget({ variations, discovered }) {
  const discoveredNames = new Set(discovered.map((d) => d.username?.toLowerCase()));
  const found = variations.filter((v) => discoveredNames.has(v.toLowerCase()));
  const notFound = variations.filter((v) => !discoveredNames.has(v.toLowerCase()));

  return (
    <div>
      <p className="type-label" style={{ marginBottom: "10px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        Username Variations — {found.length} of {variations.length} matched
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {found.map((v, i) => (
          <span key={`f-${i}`} style={{
            padding: "2px 8px", borderRadius: "var(--radius-pill)",
            background: "rgba(251,113,133,0.12)", color: "#fb7185",
            border: "1px solid rgba(251,113,133,0.3)", fontSize: "0.68rem", fontFamily: "var(--font-mono)",
          }}>{v} ✓</span>
        ))}
        {notFound.slice(0, 15).map((v, i) => (
          <span key={`n-${i}`} style={{
            padding: "2px 8px", borderRadius: "var(--radius-pill)",
            background: "rgba(255,255,255,0.04)", color: "var(--text-muted)",
            border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.68rem", fontFamily: "var(--font-mono)",
          }}>{v}</span>
        ))}
        {notFound.length > 15 && (
          <span style={{ padding: "2px 8px", fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            +{notFound.length - 15}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────
export default function TimelinePanel({ moduleMap, query, inputType }) {
  // Fast path: if query is a username/email, extract it immediately
  const usernameFromQuery = (inputType === "username" && query) ? query.toLowerCase().trim() :
    (inputType === "email" && query) ? query.split("@")[0].toLowerCase().trim() : null;

  const username =
    moduleMap?.usernameEnum?.data?.primaryUsername ||
    usernameFromQuery ||
    moduleMap?.target?.username ||
    null;
  const discovered = moduleMap?.usernameEnum?.data?.discoveredProfiles || [];

  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const checkedRef = useRef(null);

  const variations = username ? generateVariations(username) : [];

  useEffect(() => {
    if (!username || username === checkedRef.current) return;
    checkedRef.current = username;
    setLoading(true);
    setError(null);
    setTimelineData(null);

    fetch(`/api/username-timeline?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        setTimelineData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  if (!username) return null;

  const platforms = timelineData?.platforms || [];
  const timeline = timelineData?.timeline || [];
  const githubMeta = platforms.find((p) => p.platform === "GitHub")?.meta || null;
  const redditMeta = platforms.find((p) => p.platform === "Reddit")?.meta || null;

  const score = scoreUsername({ discovered, variations, githubMeta, redditMeta, username });

  const TABS = ["overview", "timeline", "platforms", "variations"];

  return (
    <GlassCard style={{ padding: 0, overflow: "hidden", marginTop: "14px" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p className="type-label">Username Intelligence</p>
          <p className="type-caption" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            @{username}
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "-1px" }}>
          {TABS.map((t) => (
            <button
              key={t} type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "6px 12px", background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--accent-ice)" : "2px solid transparent",
                color: tab === t ? "var(--accent-ice)" : "var(--text-muted)",
                cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.72rem",
                textTransform: "uppercase", letterSpacing: "0.05em",
                transition: "all 0.2s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: "2px solid rgba(125,211,252,0.2)",
            borderTop: "2px solid var(--accent-ice)",
            margin: "0 auto 12px",
            animation: "spin 0.9s linear infinite",
          }} />
          <p className="type-caption" style={{ color: "var(--text-muted)" }}>
            Scanning {username} across platforms…
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div style={{ padding: "14px" }}>
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <ThreatScore {...score} />
              {platforms.length > 0 && platforms.map((p) => (
                <PlatformBadge key={p.platform} platform={p.platform} data={p} />
              ))}
              {platforms.length === 0 && (
                <p className="type-caption" style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                  No platform data yet. Run an investigation to populate.
                </p>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {tab === "timeline" && (
            <div>
              {timeline.length > 0 ? (
                <>
                  <p className="type-micro" style={{ color: "var(--text-muted)", marginBottom: "10px" }}>
                    {timeline.length} activities found across {timelineData?.summary?.found} platform(s)
                  </p>
                  {timeline.map((evt, i) => <TimelineEvent key={i} event={evt} />)}
                </>
              ) : (
                <p className="type-caption" style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>
                  No public activity found
                </p>
              )}
            </div>
          )}

          {/* PLATFORMS */}
          {tab === "platforms" && (
            <div>
              {platforms.map((p) => {
                const pm = PLATFORM_META[p.platform] || { icon: "🌐", accent: "#94a3b8" };
                const meta = p.meta || {};
                return (
                  <div key={p.platform} style={{
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${p.status === "found" ? pm.accent + "30" : "rgba(255,255,255,0.06)"}`,
                    padding: "12px",
                    marginBottom: "10px",
                    background: p.status === "found" ? `${pm.accent}08` : "transparent",
                  }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <span>{pm.icon}</span>
                      <p className="type-label" style={{ color: p.status === "found" ? pm.accent : "var(--text-muted)", fontSize: "0.85rem" }}>
                        {p.platform}
                      </p>
                      <span style={{
                        marginLeft: "auto", fontSize: "0.65rem", fontFamily: "var(--font-mono)",
                        padding: "2px 7px", borderRadius: "var(--radius-pill)",
                        background: p.status === "found" ? `${pm.accent}20` : "rgba(255,255,255,0.05)",
                        color: p.status === "found" ? pm.accent : "var(--text-muted)",
                      }}>
                        {p.status?.toUpperCase()}
                      </span>
                    </div>
                    {p.status === "found" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        {meta.account_age && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Account Age</p>
                            <p className="type-caption" style={{ color: pm.accent }}>{meta.account_age}</p>
                          </div>
                        )}
                        {meta.followers !== undefined && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Followers</p>
                            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>{meta.followers?.toLocaleString()}</p>
                          </div>
                        )}
                        {meta.public_repos !== undefined && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Public Repos</p>
                            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>{meta.public_repos}</p>
                          </div>
                        )}
                        {meta.total_karma !== undefined && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Karma</p>
                            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>{meta.total_karma?.toLocaleString()}</p>
                          </div>
                        )}
                        {meta.verifiedProofs !== undefined && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Verified Proofs</p>
                            <p className="type-caption" style={{ color: pm.accent }}>{meta.verifiedProofs} identity link(s)</p>
                          </div>
                        )}
                        {meta.name && (
                          <div>
                            <p className="type-micro" style={{ color: "var(--text-muted)" }}>Name</p>
                            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>{meta.name}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VARIATIONS */}
          {tab === "variations" && (
            <VariationsWidget variations={variations} discovered={discovered} />
          )}
        </div>
      )}
    </GlassCard>
  );
}
