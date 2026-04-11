export default function Logo({ compact = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "8px" : "12px",
      }}
    >
      <div
        style={{
          width: compact ? "2px" : "3px",
          height: compact ? "16px" : "20px",
          borderRadius: "2px",
          background: "var(--text-primary)",
        }}
      />
      <span
        style={{
          fontSize: compact ? "0.75rem" : "0.875rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        ThreadLine
      </span>
    </div>
  );
}

