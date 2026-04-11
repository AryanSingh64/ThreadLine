const LABELS = {
  email: "Email",
  domain: "Domain",
  ip: "IP Address",
  username: "Username",
  unknown: "Unknown",
};

const TYPE_COLORS = {
  email: "var(--accent-signal)",
  domain: "#a78bfa",
  ip: "var(--accent-ember)",
  username: "var(--accent-warn)",
  unknown: "var(--text-secondary)",
};

export default function InputTypeIndicator({ type }) {
  if (!type || type === "unknown") {
    return null;
  }

  return (
    <span
      className="type-label"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "24px",
        padding: "0 10px",
        borderRadius: "999px",
        border: `1px solid color-mix(in srgb, ${TYPE_COLORS[type] || "var(--text-secondary)"} 45%, transparent)`,
        background: "rgba(255,255,255,0.025)",
        color: TYPE_COLORS[type] || "var(--text-secondary)",
        letterSpacing: "0.15em",
      }}
    >
      {LABELS[type] || "Unknown"}
    </span>
  );
}
