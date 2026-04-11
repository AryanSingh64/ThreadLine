export default function ScanMessages({ messages }) {
  const latest = messages.slice(-3);

  return (
    <div
      style={{
        width: "min(480px, 80vw)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        background: "rgba(0, 0, 0, 0.24)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {latest.map((message, index) => (
        <p
          key={`${message}-${index}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            opacity: index === latest.length - 1 ? 0.9 : 0.45,
          }}
        >
          {`> ${message}`}
        </p>
      ))}
    </div>
  );
}
