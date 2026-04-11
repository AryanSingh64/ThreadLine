import GlassCard from "../ui/GlassCard";

export default function EvidencePanel({ moduleList }) {
  return (
    <GlassCard style={{ padding: "18px", minHeight: "220px" }}>
      <p className="type-label" style={{ marginBottom: "12px" }}>
        Evidence Signals
      </p>
      <div style={{ display: "grid", gap: "8px" }}>
        {moduleList.map((item) => (
          <div
            key={item.module}
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
            }}
          >
            <p
              className="type-caption"
              style={{ color: "var(--text-secondary)", marginBottom: "4px" }}
            >
              {item.module}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
              {item.summary || "No summary available"}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

