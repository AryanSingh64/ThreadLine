"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { combinedBreachCheck } from "@/lib/breachCheck";

export default function BreachIntelCard({ query, inputType }) {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [breachCount, setBreachCount] = useState(0);
  const [topBreaches, setTopBreaches] = useState([]);
  const checkedRef = useRef(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email =
    inputType === "email" && query && EMAIL_REGEX.test(query)
      ? query.toLowerCase().trim()
      : null;

  useEffect(() => {
    if (!email || email === checkedRef.current) return;
    checkedRef.current = email;
    setStatus("loading");

    try {
      const cached = JSON.parse(
        localStorage.getItem(`breach_result_${email}`) || "null"
      );
      if (cached) {
        setStatus(cached.type);
        setBreachCount(cached.count || 0);
        setTopBreaches(cached.top || []);
        return;
      }
    } catch {}

    combinedBreachCheck(email)
      .then((res) => {
        const type =
          res.exactMatch && (res.breaches?.length || 0) > 0
            ? "pwned"
            : res.domainMatch
            ? "partial"
            : "clean";
        const count =
          res.breaches?.length ||
          (res.domainBreaches?.length || 0) + (res.metaMatches?.length || 0) ||
          0;
        const top = (res.breaches || res.metaMatches || [])
          .slice(0, 3)
          .map((b) => b.name || b.Name || String(b));
        setStatus(type);
        setBreachCount(count);
        setTopBreaches(top);
        try {
          localStorage.setItem(
            `breach_result_${email}`,
            JSON.stringify({ type, count, top })
          );
        } catch {}
      })
      .catch(() => setStatus("error"));
  }, [email]);

  if (!email) return null;

  const cfg = {
    pwned: {
      dot: "#B05A5A",
      glow: "rgba(176,90,90,0.4)",
      borderColor: "rgba(176,90,90,0.3)",
      bg: "rgba(176,90,90,0.05)",
      label: "Exposure Detected",
      sub: `Found in ${breachCount} breach${breachCount !== 1 ? "es" : ""}`,
      statusColor: "#C97B6A",
      pulse: true,
    },
    partial: {
      dot: "#A08040",
      glow: "rgba(160,128,64,0.35)",
      borderColor: "rgba(160,128,64,0.28)",
      bg: "rgba(160,128,64,0.05)",
      label: "Service-Level Exposure",
      sub: `Domain breached in ${breachCount} service${breachCount !== 1 ? "s" : ""}`,
      statusColor: "#C4A35A",
      pulse: false,
    },
    clean: {
      dot: "#4A8C6A",
      glow: "rgba(74,140,106,0.3)",
      borderColor: "rgba(74,140,106,0.2)",
      bg: "rgba(74,140,106,0.04)",
      label: "No Breaches Found",
      sub: "Not in known breach databases",
      statusColor: "#6BAF8D",
      pulse: false,
    },
    loading: {
      dot: "#888",
      glow: "none",
      borderColor: "rgba(255,255,255,0.1)",
      bg: "rgba(13,13,25,0.65)",
      label: "Checking databases…",
      sub: "k-anonymity lookup in progress",
      statusColor: "var(--text-muted)",
      pulse: true,
    },
    error: {
      dot: "#555",
      glow: "none",
      borderColor: "rgba(255,255,255,0.08)",
      bg: "rgba(13,13,25,0.65)",
      label: "Check unavailable",
      sub: "Could not reach breach database",
      statusColor: "var(--text-muted)",
      pulse: false,
    },
    idle: {
      dot: "#555",
      glow: "none",
      borderColor: "rgba(255,255,255,0.08)",
      bg: "rgba(13,13,25,0.65)",
      label: "Breach Intelligence",
      sub: "Waiting…",
      statusColor: "var(--text-muted)",
      pulse: false,
    },
  };

  const c = cfg[status] || cfg.idle;
  const isClickable = status === "pwned" || status === "partial" || status === "clean";

  return (
    <>
      <div
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={
          isClickable
            ? () => router.push(`/breach-intel?q=${encodeURIComponent(email)}&type=email`)
            : undefined
        }
        onKeyDown={
          isClickable
            ? (e) => { if (e.key === "Enter" || e.key === " ") router.push(`/breach-intel?q=${encodeURIComponent(email)}&type=email`); }
            : undefined
        }
        style={{
          padding: "14px 16px",
          cursor: isClickable ? "pointer" : "default",
          border: `1px solid ${c.borderColor}`,
          background: c.bg,
          borderRadius: "var(--radius-lg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
          userSelect: "none",
          outline: "none",
        }}
        onMouseEnter={
          isClickable
            ? (e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = c.dot + "99";
                e.currentTarget.style.boxShadow = `0 4px 20px ${c.glow}`;
              }
            : undefined
        }
        onMouseLeave={
          isClickable
            ? (e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = c.borderColor;
                e.currentTarget.style.boxShadow = "none";
              }
            : undefined
        }
      >
        {/* Row: dot + title + arrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
            <span
              style={{
                display: "block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c.dot,
                boxShadow: c.glow !== "none" ? `0 0 7px ${c.glow}` : "none",
              }}
            />
            {c.pulse && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: c.dot + "55",
                  animation: "bic-pulse 1.4s ease-out infinite",
                }}
              />
            )}
          </span>

          <p style={{
            flex: 1,
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
          }}>
            Breach Intelligence
          </p>

          {isClickable && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>

        {/* Status */}
        <p style={{
          color: c.statusColor,
          fontWeight: 700,
          fontSize: "0.8rem",
          letterSpacing: "0.04em",
          marginBottom: 4,
          paddingLeft: 20,
          fontFamily: "var(--font-display)",
        }}>
          {c.label}
        </p>
        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.72rem",
          paddingLeft: 20,
          fontFamily: "var(--font-mono)",
        }}>
          {c.sub}
        </p>

        {/* Top breach pills */}
        {topBreaches.length > 0 && (
          <div style={{ marginTop: 10, paddingLeft: 20, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {topBreaches.map((name, i) => (
              <span key={i} style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(176,90,90,0.09)",
                border: "1px solid rgba(176,90,90,0.2)",
                color: "#C97B6A",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
              }}>
                {name}
              </span>
            ))}
            {breachCount > 3 && (
              <span style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
              }}>
                +{breachCount - 3} more
              </span>
            )}
          </div>
        )}

        {isClickable && (
          <p style={{
            marginTop: 10,
            paddingLeft: 20,
            color: "var(--text-muted)",
            fontSize: "0.68rem",
            fontFamily: "var(--font-mono)",
            opacity: 0.65,
          }}>
            View full report →
          </p>
        )}
      </div>

      <style>{`
        @keyframes bic-pulse {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}
