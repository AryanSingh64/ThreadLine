"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";

const SCORE_COLOR = (s) =>
  s == null ? "var(--text-muted)"
  : s >= 80 ? "#B05A5A"
  : s >= 60 ? "#C97B6A"
  : s >= 30 ? "#C4A35A"
  : "#6BAF8D";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Compact horizontal chip list, sits below the centered search bar */
export default function InlineHistoryPanel({ onSelect }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = () => {
      try { setHistory(JSON.parse(localStorage.getItem("threadline_history") || "[]")); }
      catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (history.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 10,
    }}>
      <Clock size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      {history.slice(0, 6).map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onSelect?.(h.query)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
          }}
        >
          <span style={{
            fontSize: "0.72rem",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {h.query}
          </span>
          {h.score != null && (
            <span style={{ fontSize: "0.65rem", color: SCORE_COLOR(h.score), fontFamily: "var(--font-mono)" }}>
              {h.score}
            </span>
          )}
          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {timeAgo(h.ts)}
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => { localStorage.removeItem("threadline_history"); setHistory([]); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", display: "flex", alignItems: "center",
        }}
        title="Clear history"
      >
        <X size={11} />
      </button>
    </div>
  );
}
