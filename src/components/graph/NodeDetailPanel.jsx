"use client";

import { useEffect, useState } from "react";
import GlassCard from "../ui/GlassCard";

function PrettyJson({ data }) {
  return (
    <pre
      style={{
        marginTop: "8px",
        padding: "10px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "rgba(0,0,0,0.32)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.72rem",
        color: "var(--text-secondary)",
        overflow: "auto",
        maxHeight: "220px",
        whiteSpace: "pre-wrap",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function NodeDetailPanel({ node, mode = "standard" }) {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function enrich() {
      if (!node) {
        setIntel(null);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/node-intel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ node, mode }),
        });
        const payload = await response.json();
        if (!active) return;
        if (!response.ok || !payload?.ok) {
          setError("Unable to fetch node enrichment.");
          setIntel(null);
        } else {
          setIntel(payload.details);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to fetch node enrichment.");
        setIntel(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    enrich();
    return () => {
      active = false;
    };
  }, [mode, node]);

  return (
    <GlassCard style={{ padding: "14px", minHeight: "180px" }}>
      <p className="type-label" style={{ marginBottom: "10px" }}>
        Node Detail
      </p>
      {node ? (
        <div style={{ display: "grid", gap: "4px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{node.label}</p>
          <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
            Type: {node.type}
          </p>
          <p
            className="type-caption"
            style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}
          >
            {node.id}
          </p>
          <p className="type-caption" style={{ color: "var(--accent-ice)", marginTop: "6px" }}>
            {loading ? "Fetching public enrichment..." : "Public enrichment"}
          </p>
          {error ? <p style={{ color: "var(--accent-ember)", fontSize: "0.8rem" }}>{error}</p> : null}
          {intel ? <PrettyJson data={intel} /> : null}
        </div>
      ) : (
        <p className="type-body">Click a graph node to inspect details.</p>
      )}
    </GlassCard>
  );
}

