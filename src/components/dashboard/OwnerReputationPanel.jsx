import GlassCard from "../ui/GlassCard";

function detailRow(label, value, valueColor = "var(--text-primary)") {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
      key={label}
    >
      <span className="type-caption" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.86rem", color: valueColor }}>{value || "-"}</span>
    </div>
  );
}

function reputationColor(value) {
  if (value === "Malicious") return "var(--accent-ember)";
  if (value === "Suspicious") return "var(--accent-warn)";
  if (value === "Neutral") return "var(--accent-signal)";
  return "var(--text-secondary)";
}

export default function OwnerReputationPanel({
  query,
  inputType,
  asnData,
  datasetMatch,
  score,
}) {
  const domain =
    inputType === "domain"
      ? query
      : inputType === "email"
        ? String(query).split("@")[1] || ""
        : "";

  const findings = datasetMatch?.data?.findings || [];
  const phishHits =
    findings.find((item) => item.source === "phishtank_csv")?.records?.length || 0;
  const securityHits =
    findings.find((item) => item.source === "security_csv")?.records?.length || 0;
  const topPresence =
    findings.find((item) => item.source === "top_1m_presence")?.records?.[0]?.present;

  const webReputation =
    phishHits > 0
      ? "Malicious"
      : securityHits > 0
        ? "Suspicious"
        : topPresence
          ? "Neutral"
          : "Unknown";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "12px",
      }}
    >
      <GlassCard
        style={{
          padding: "14px",
          background:
            "linear-gradient(180deg, rgba(16, 24, 40, 0.26) 0%, rgba(12, 14, 20, 0.2) 100%)",
          border: "1px solid rgba(125, 211, 252, 0.2)",
        }}
      >
        <p className="type-label" style={{ marginBottom: "8px" }}>
          Owner Details
        </p>
        {detailRow("URI", query)}
        {detailRow("Type", (inputType || "unknown").toUpperCase())}
        {detailRow("Hostname", domain || query)}
        {detailRow("Domain", domain || "-")}
        {detailRow("Network Owner", asnData?.org || asnData?.isp || "Pending deep scan")}
      </GlassCard>
      <GlassCard
        style={{
          padding: "14px",
          background:
            "linear-gradient(180deg, rgba(28, 18, 28, 0.24) 0%, rgba(12, 14, 20, 0.2) 100%)",
          border: "1px solid rgba(167, 139, 250, 0.22)",
        }}
      >
        <p className="type-label" style={{ marginBottom: "8px" }}>
          Reputation Details
        </p>
        {detailRow("Web Reputation", webReputation, reputationColor(webReputation))}
        {detailRow("Threat Score", score ? `${score.score}/100 — ${score.label}` : "Pending")}
        {detailRow("Phishing Matches", phishHits > 0 ? `${phishHits} hit(s) detected` : "None found", phishHits > 0 ? "var(--accent-ember)" : "var(--accent-signal)")}
        {detailRow("Threat Intelligence", securityHits > 0 ? `${securityHits} indicator(s) matched` : "Clean", securityHits > 0 ? "var(--accent-warn)" : "var(--accent-signal)")}
      </GlassCard>
    </div>
  );
}

