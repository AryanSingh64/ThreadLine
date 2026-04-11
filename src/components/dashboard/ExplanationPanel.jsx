import GlassCard from "../ui/GlassCard";

export default function ExplanationPanel({ text }) {
  return (
    <GlassCard style={{ padding: "18px", gridColumn: "span 2", minHeight: "160px" }}>
      <p className="type-label" style={{ marginBottom: "12px" }}>
        AI Explanation
      </p>
      <p style={{ color: "var(--text-primary)", lineHeight: 1.7, fontSize: "0.9rem" }}>
        {text || "Awaiting explanation..."}
      </p>
    </GlassCard>
  );
}
