import GlassCard from "../ui/GlassCard";

export default function SubdomainPanel({ moduleMap }) {
  const subdomainData = moduleMap?.subdomain?.data;
  
  if (!subdomainData || !subdomainData.discovered || subdomainData.discovered.length === 0) {
    return null;
  }

  const advanced = subdomainData.advanced || [];

  return (
    <GlassCard style={{ padding: "14px", marginTop: "14px" }}>
      <p className="type-label" style={{ marginBottom: "10px" }}>
        Subdomain Intel ({subdomainData.discovered.length})
      </p>
      {advanced.length === 0 ? (
        <p className="type-caption" style={{ color: "var(--text-muted)" }}>
          Checking resolution status...
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {advanced.map(({ subdomain, active }) => (
            <div
              key={subdomain}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              <span className="type-mono" style={{ color: "var(--text-primary)", fontSize: "0.8rem", wordBreak: "break-all" }}>
                {subdomain}
              </span>
              {active && (
                <span className="type-micro" style={{
                  padding: "3px 6px", 
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(251, 113, 133, 0.15)", // pink/red
                  color: "var(--accent-ember)", 
                  border: "1px solid rgba(251, 113, 133, 0.3)",
                  marginLeft: "8px", 
                  flexShrink: 0
                }}>
                  CRITICAL
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
