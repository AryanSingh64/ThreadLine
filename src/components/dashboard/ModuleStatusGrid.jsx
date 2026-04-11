import GlassCard from "../ui/GlassCard";

export default function ModuleStatusGrid({ moduleList, compact = false }) {
  return (
    <GlassCard style={{ padding: compact ? "14px" : "18px", gridColumn: compact ? "auto" : "span 2" }}>
      <p className="type-label" style={{ marginBottom: "12px" }}>
        Module Status
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "8px",
        }}
      >
        {moduleList.map((item) => {
          const statusColor =
            item.status === "success"
              ? "var(--accent-signal)"
              : item.status === "partial"
                ? "var(--accent-warn)"
                : "var(--accent-ember)";
          return (
            <div
              key={item.module}
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                className="type-caption"
                style={{ color: "var(--text-secondary)", textTransform: "none", letterSpacing: "0.06em" }}
              >
                {item.module}
              </span>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: statusColor,
                }}
              />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
