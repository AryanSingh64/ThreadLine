"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BreachPanel from "@/components/dashboard/BreachPanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import UserBadge from "@/components/ui/UserBadge";

function BreachIntelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const inputType = searchParams.get("type") || "email";
  const [agentName] = useLocalStorage("threadline_agent_name", "");
  const [archetype] = useLocalStorage("threadline_archetype", "");

  return (
    <div className="page-shell">
      <UserBadge name={agentName} archetype={archetype} />

      <div
        className="page-container"
        style={{ maxWidth: "720px", padding: "var(--space-3xl) 24px" }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "var(--space-xl)",
            background: "none",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 16px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
            fontSize: "0.75rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Investigation
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(251,113,133,0.08)",
              border: "1px solid rgba(251,113,133,0.2)",
              marginBottom: "var(--space-md)",
              boxShadow: "0 0 24px rgba(251,113,133,0.12)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p
            className="type-label"
            style={{ marginBottom: "8px", color: "var(--text-muted)" }}
          >
            Breach Intelligence
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            Identity{" "}
            <span style={{ fontWeight: 700, fontStyle: "italic" }}>
              Exposure Report
            </span>
          </h1>
          {query && (
            <p
              className="type-mono"
              style={{
                color: "var(--accent-ice)",
                fontSize: "0.85rem",
                marginTop: "6px",
              }}
            >
              {query}
            </p>
          )}
        </div>

        {/* Full Breach Panel */}
        {query ? (
          <BreachPanel moduleMap={{}} query={query} inputType={inputType} />
        ) : (
          <div
            style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
              <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="type-label">No target specified</p>
            <p
              className="type-caption"
              style={{ marginTop: 8, color: "var(--text-muted)" }}
            >
              Navigate here from an investigation with an email target.
            </p>
          </div>
        )}

        {/* Privacy note */}
        <p
          className="type-micro"
          style={{
            marginTop: "32px",
            textAlign: "center",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Privacy-preserving k-anonymity — your email is never transmitted.
          <br />
          Breach data sourced from Have I Been Pwned (HIBP) · 966 verified
          incidents
        </p>
      </div>
    </div>
  );
}

export default function BreachIntelPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-void)", minHeight: "100vh" }} />}>
      <BreachIntelContent />
    </Suspense>
  );
}
