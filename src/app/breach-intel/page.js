"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
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
          <ArrowLeft size={14} />
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
              background: "rgba(255,51,102,0.1)",
              border: "1px solid rgba(255,51,102,0.25)",
              marginBottom: "var(--space-md)",
            }}
          >
            <ShieldAlert size={24} style={{ color: "#fb7185" }} />
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
            <ShieldAlert size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
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
          🔒 Privacy-preserving k-anonymity — your email is never transmitted.
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
