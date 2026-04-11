"use client";

import { useEffect, useState } from "react";
import GlassCard from "../ui/GlassCard";

// ── Risk colours ──────────────────────────────────────────────────────
const RISK = {
  critical: { color: "#ff3366", bg: "rgba(255,51,102,0.1)", border: "rgba(255,51,102,0.3)", label: "CRITICAL" },
  high:     { color: "#fb7185", bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.25)", label: "HIGH" },
  medium:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)",  label: "MEDIUM" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)",   label: "LOW" },
  unknown:  { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", label: "UNKNOWN" },
};

// ── Inline SVG Icons ──────────────────────────────────────────────────
const icons = {
  globe:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  server:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  plug:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 00-2 2v3a6 6 0 0012 0v-3a2 2 0 00-2-2z"/></svg>,
  alert:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  user:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  network:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="17"/><line x1="12" y1="12" x2="19" y2="17"/></svg>,
  lock:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  cloud:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  wifi:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  pin:         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  shield:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z"/></svg>,
  cursor:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  branch:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
};

// ── Micro components ──────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p style={{ fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 5 }}>
      {children}
    </p>
  );
}

function Row({ icon, label, value, valueColor }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ color: "var(--text-muted)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: "0.72rem", color: valueColor || "var(--text-primary)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <Label>{title}</Label>
      <div style={{ display: "grid", gap: 0, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.2)", overflow: "hidden", padding: "0 8px" }}>
        {children}
      </div>
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "var(--radius-pill)",
      background: `${color}18`, border: `1px solid ${color}40`,
      color: color, fontSize: "0.65rem", fontFamily: "var(--font-mono)",
    }}>
      {label}
    </span>
  );
}

function TagList({ items, color = "var(--accent-ice)", emptyText }) {
  if (!items?.length) return emptyText ? <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontStyle: "italic" }}>{emptyText}</p> : null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
      {items.map((t, i) => <Pill key={i} label={t} color={color} />)}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────
export default function NodeDetailPanel({ node, mode = "standard" }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!node) { setDetails(null); setError(""); setLoading(false); return; }

    setLoading(true);
    setError("");
    setDetails(null);

    fetch("/api/node-intel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ node, mode }),
    })
      .then(r => r.json())
      .then(payload => {
        if (!active) return;
        if (payload?.ok) setDetails(payload.details);
        else setError("Enrichment failed.");
      })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [node, mode]);

  // ── Empty state ───────────────────────────────────────────────────
  if (!node) {
    return (
      <GlassCard style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ opacity: 0.3, marginBottom: 10 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <p className="type-micro" style={{ color: "var(--text-muted)" }}>Click any node in the graph to inspect intelligence</p>
      </GlassCard>
    );
  }

  const nodeType = node.type || "unknown";
  const typeColor = details?.node?.color || "#94a3b8";
  const e = details?.enrichment || {};
  const portInfo = e.port;
  const riskCfg = RISK[portInfo?.riskLevel] || RISK.unknown;

  return (
    <GlassCard style={{ padding: "14px 16px", overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `${typeColor}15`, border: `1px solid ${typeColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: typeColor, flexShrink: 0,
        }}>
          {icons[nodeType] || icons.alert}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.label || node.id}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: typeColor, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              {details?.node?.typeLabel || nodeType}
            </span>
            {portInfo?.riskLevel && (
              <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: "var(--radius-pill)", background: riskCfg.bg, border: `1px solid ${riskCfg.border}`, color: riskCfg.color, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                {riskCfg.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: "var(--text-muted)" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(125,211,252,0.2)", borderTop: "2px solid var(--accent-ice)", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>Enriching node intelligence...</span>
        </div>
      )}

      {error && <p style={{ color: "var(--status-danger)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>{error}</p>}

      {details && !loading && (
        <div style={{ display: "grid", gap: 0 }}>

          {/* ── Definition ── */}
          {details.definition && (
            <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <Label>What is this?</Label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {details.definition}
              </p>
            </div>
          )}

          {/* ── Port analysis ── */}
          {portInfo && (
            <Section title="Port Analysis">
              <Row icon={icons.plug}   label="Port"     value={portInfo.number} />
              <Row icon={icons.server} label="Service"  value={portInfo.service} valueColor={typeColor} />
              <Row icon={icons.wifi}   label="Target IP" value={portInfo.ip} />
            </Section>
          )}

          {portInfo?.analysis && (
            <div style={{ marginTop: 10, padding: "10px 12px", border: `1px solid ${riskCfg.border}`, borderRadius: "var(--radius-sm)", background: riskCfg.bg }}>
              <Label>Threat Analysis</Label>
              <p style={{ fontSize: "0.74rem", color: riskCfg.color, lineHeight: 1.6 }}>{portInfo.analysis}</p>
            </div>
          )}

          {/* ── Geolocation ── */}
          {e.geolocation && (
            <Section title="Geolocation">
              <Row icon={icons.pin}    label="Location" value={[e.geolocation.city, e.geolocation.region, e.geolocation.country].filter(Boolean).join(", ")} />
              <Row icon={icons.cloud}  label="Provider" value={e.geolocation.isp} />
              <Row icon={icons.network} label="ASN"     value={e.geolocation.asn} />
              <Row icon={icons.server} label="Org"      value={e.geolocation.org} />
              {e.geolocation.isHosting && (
                <Row icon={icons.alert} label="Hosting" value="Datacenter / hosting range" valueColor="#fbbf24" />
              )}
            </Section>
          )}

          {/* ── Infrastructure (Shodan) ── */}
          {e.infrastructure && (
            <>
              {e.infrastructure.allOpenPorts?.length > 0 || e.infrastructure.openPorts?.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <Label>All Open Ports on this IP</Label>
                  <TagList items={(e.infrastructure.allOpenPorts || e.infrastructure.openPorts).map(String)} color="#fb7185" />
                </div>
              ) : null}
              {e.infrastructure.vulns?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Known Vulnerabilities (CVEs)</Label>
                  <TagList items={e.infrastructure.vulns} color="#ff3366" emptyText="None detected" />
                </div>
              )}
              {e.infrastructure.hostnames?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Hostnames</Label>
                  <TagList items={e.infrastructure.hostnames} color="#94a3b8" />
                </div>
              )}
              {e.infrastructure.cpes?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Software (CPE)</Label>
                  <TagList items={e.infrastructure.cpes.slice(0, 6)} color="#a78bfa" />
                </div>
              )}
              {e.infrastructure.tags?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Shodan Tags</Label>
                  <TagList items={e.infrastructure.tags} color="#7dd3fc" />
                </div>
              )}
            </>
          )}

          {/* ── DNS ── */}
          {e.dns && (
            <>
              {e.dns.aRecords?.length > 0 && (
                <Section title="A Records (IP)">
                  {e.dns.aRecords.map((ip, i) => (
                    <Row key={i} icon={icons.server} label={`IPv4 ${i + 1}`} value={ip} />
                  ))}
                </Section>
              )}
              {e.dns.nameServers?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Name Servers</Label>
                  <TagList items={e.dns.nameServers} color="#94a3b8" />
                </div>
              )}
            </>
          )}

          {/* ── Email Security ── */}
          {e.emailSecurity && (
            <div style={{ marginTop: 14 }}>
              <Label>Email Security</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill label={e.emailSecurity.hasSPF ? "SPF ✓" : "SPF missing"} color={e.emailSecurity.hasSPF ? "#34d399" : "#fb7185"} />
                <Pill label={e.emailSecurity.hasDMARC ? "DMARC ✓" : "DMARC missing"} color={e.emailSecurity.hasDMARC ? "#34d399" : "#fb7185"} />
              </div>
              {e.emailSecurity.spf && (
                <p style={{ marginTop: 6, fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{e.emailSecurity.spf}</p>
              )}
            </div>
          )}

          {/* ── Node ID ── */}
          <p style={{ marginTop: 12, fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", opacity: 0.5 }}>
            id: {node.id}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </GlassCard>
  );
}
