"use client";

import { useEffect, useState } from "react";
import GlassCard from "../ui/GlassCard";

const SCORE_COLOR = (s) =>
  s == null ? "var(--text-muted)"
  : s >= 80 ? "#ff3366"
  : s >= 60 ? "#fb7185"
  : s >= 30 ? "#fbbf24"
  : "#34d399";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPanel({ onSelect }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = () => {
      try {
        setHistory(JSON.parse(localStorage.getItem("threadline_history") || "[]"));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (history.length === 0) return null;

  return (
    <GlassCard style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p className="type-label" style={{ fontSize: "0.76rem" }}>Recent Investigations</p>
        <button
          type="button"
          onClick={() => { localStorage.removeItem("threadline_history"); setHistory([]); }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.68rem", fontFamily: "var(--font-mono)" }}
        >
          clear
        </button>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {history.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onSelect?.(h.query)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              textAlign: "left", width: "100%",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {h.query}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {h.score != null && (
                <span style={{ fontSize: "0.68rem", color: SCORE_COLOR(h.score), fontFamily: "var(--font-mono)" }}>
                  {h.score}
                </span>
              )}
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{timeAgo(h.ts)}</span>
            </span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
