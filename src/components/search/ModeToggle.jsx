export default function ModeToggle({ mode, onChange }) {
  const isDeep = mode === "deep";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
      }}
    >
      <span className="type-label" style={{ color: "var(--text-muted)" }}>
        Standard
      </span>
      <button
        type="button"
        className={`toggle-track ${isDeep ? "active" : ""}`}
        onClick={() => onChange(isDeep ? "standard" : "deep")}
        aria-label="Toggle deep mode"
        aria-pressed={isDeep}
      >
        <span className="toggle-knob" />
      </button>
      <span className="type-label" style={{ color: isDeep ? "var(--accent-ice)" : "var(--text-muted)" }}>
        Deep
      </span>
    </div>
  );
}
