import GlassCard from "../ui/GlassCard";

function meterColor(score) {
  if (score <= 30) return "var(--accent-signal)";
  if (score <= 60) return "var(--accent-warn)";
  if (score <= 80) return "var(--accent-ember)";
  return "#ff224f";
}

export default function ThreatMeter({ score }) {
  const value = score?.score || 0;
  const color = meterColor(value);

  return (
    <GlassCard
      style={{
        padding: "18px",
        textAlign: "center",
        background:
          "linear-gradient(180deg, rgba(16, 24, 40, 0.28) 0%, rgba(12, 14, 20, 0.24) 100%)",
        border: "1px solid rgba(125, 211, 252, 0.2)",
      }}
    >
      <p className="type-label" style={{ marginBottom: "12px" }}>
        Threat Meter
      </p>
      <div
        style={{
          margin: "0 auto",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 0 28px color-mix(in srgb, ${color} 28%, transparent)`,
        }}
      >
        <div
          style={{
            width: "92px",
            height: "92px",
            borderRadius: "50%",
            background: "var(--bg-surface)",
            display: "grid",
            placeItems: "center",
            color: "var(--text-primary)",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          {value}
        </div>
      </div>
      <p className="type-body" style={{ marginTop: "12px", color }}>
        {score?.label || "No score yet"}
      </p>
    </GlassCard>
  );
}
