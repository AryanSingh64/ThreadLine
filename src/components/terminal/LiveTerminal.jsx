import GlassCard from "../ui/GlassCard";

export default function LiveTerminal({ messages, height = "180px" }) {
  return (
    <GlassCard style={{ padding: "14px", background: "rgba(0,0,0,0.6)" }}>
      <p className="type-label" style={{ marginBottom: "10px", color: "var(--accent-signal)" }}>
        Live Terminal
      </p>
      <div
        style={{
          maxHeight: height,
          overflow: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "#64ff92",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {messages.map((line, index) => (
          <p key={`${line}-${index}`} style={{ wordBreak: "break-all", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{`$ ${line}`}</p>
        ))}
      </div>
    </GlassCard>
  );
}
