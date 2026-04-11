import GlassCard from "../ui/GlassCard";

export default function SummaryPanel({ query, inputType, mode, score }) {
  return (
    <GlassCard style={{ padding: "18px", gridColumn: "span 2" }}>
      <p className="type-label" style={{ marginBottom: "10px" }}>
        Executive Summary
      </p>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 400, color: "var(--text-primary)" }}>
        {query}
      </h3>
      <p className="type-body" style={{ marginTop: "8px" }}>
        Input Type: {inputType || "Unknown"} • Mode: {mode}
      </p>
      {score ? (
        <p
          style={{
            marginTop: "10px",
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
          }}
        >
          Threat Score: <strong style={{ color: "var(--text-primary)" }}>{score.score}/100</strong> ({score.label})
        </p>
      ) : null}
    </GlassCard>
  );
}

