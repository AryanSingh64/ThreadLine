"use client";

import { useState } from "react";
import GlassCard from "../ui/GlassCard";
import BreachPanel from "./BreachPanel";

export default function BreachBadge({ moduleMap, query, inputType }) {
  const [expanded, setExpanded] = useState(false);

  // Determine breach status from BreachPanel's cached result via localStorage
  const cacheKey = query ? `breach_result_${query.toLowerCase()}` : null;
  let breachCount = 0;
  let hasBreach = false;
  if (typeof window !== "undefined" && cacheKey) {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached?.type === "pwned" || cached?.type === "partial") {
        hasBreach = true;
        breachCount = cached?.breachCount || cached?.domainBreachCount || 0;
      }
    } catch {}
  }

  // Also check moduleMap for quick signal
  const emailBreached = moduleMap?.emailIntel?.data?.externalSignals?.hibp?.breached;
  if (emailBreached) hasBreach = true;

  return (
    <>
      {/* Compact sidebar card */}
      <GlassCard
        onClick={() => setExpanded((v) => !v)}
        style={{
          padding: "12px 16px",
          cursor: "pointer",
          position: "relative",
          border: hasBreach
            ? "1px solid rgba(255,51,102,0.35)"
            : "1px solid rgba(0,212,255,0.12)",
          background: hasBreach
            ? "linear-gradient(135deg,rgba(255,51,102,0.08),rgba(13,13,25,0.6))"
            : "rgba(13,13,25,0.6)",
          transition: "border 0.3s",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Dot indicator */}
          <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: hasBreach ? "#ff3366" : "#00ff88",
                display: "inline-block",
                boxShadow: hasBreach
                  ? "0 0 8px rgba(255,51,102,0.6)"
                  : "0 0 6px rgba(0,255,136,0.4)",
              }}
            />
            {hasBreach && (
              <span
                style={{
                  position: "absolute",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "rgba(255,51,102,0.5)",
                  animation: "pulse-ring 1.4s ease-out infinite",
                  top: 0,
                  left: 0,
                }}
              />
            )}
          </span>

          <span className="type-label" style={{ flex: 1, fontSize: "0.78rem" }}>
            Breach Intelligence
          </span>

          {breachCount > 0 && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(255,51,102,0.18)",
                border: "1px solid rgba(255,51,102,0.3)",
                color: "#fb7185",
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {breachCount} breach{breachCount !== 1 ? "es" : ""}
            </span>
          )}

          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            ▼
          </span>
        </div>

        {!expanded && hasBreach && (
          <p className="type-micro" style={{ marginTop: 6, color: "var(--accent-ember)", paddingLeft: 20 }}>
            Exposure detected — click to view details
          </p>
        )}
        {!expanded && !hasBreach && (
          <p className="type-micro" style={{ marginTop: 6, color: "var(--text-muted)", paddingLeft: 20 }}>
            {query ? "Checking breach databases…" : "Enter a query to check"}
          </p>
        )}
      </GlassCard>

      {/* Expanded breach panel */}
      {expanded && (
        <div style={{ marginTop: 0 }}>
          <BreachPanel
            moduleMap={moduleMap}
            query={query}
            inputType={inputType}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </>
  );
}
