"use client";

import { useEffect, useRef, useState } from "react";
import { combinedBreachCheck } from "@/lib/breachCheck";
import GlassCard from "@/components/ui/GlassCard";

const SEVERITY_COLORS = {
  critical: { bg: "rgba(255,51,102,0.15)", border: "rgba(255,51,102,0.4)", text: "#ff3366" },
  high:     { bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.35)", text: "#fb7185" },
  medium:   { bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
  low:      { bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.3)", text: "#34d399" },
};

const DATACLASS_COLORS = {
  password: "#fb7185",
  email:    "#7dd3fc",
  username: "#fbbf24",
  phone:    "#a78bfa",
  name:     "#6ee7b7",
  address:  "#fdba74",
  ip:       "#94a3b8",
  default:  "#cbd5e1",
};

function getDataclassColor(cls) {
  const lower = cls.toLowerCase();
  if (lower.includes("password")) return DATACLASS_COLORS.password;
  if (lower.includes("email")) return DATACLASS_COLORS.email;
  if (lower.includes("username")) return DATACLASS_COLORS.username;
  if (lower.includes("phone")) return DATACLASS_COLORS.phone;
  if (lower.includes("name")) return DATACLASS_COLORS.name;
  if (lower.includes("address")) return DATACLASS_COLORS.address;
  if (lower.includes("ip")) return DATACLASS_COLORS.ip;
  return DATACLASS_COLORS.default;
}

function formatCount(n) {
  if (!n) return "Unknown";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor(diff / (30 * 24 * 3600 * 1000));
  if (years >= 1) return `${years}yr ago`;
  if (months >= 1) return `${months}mo ago`;
  return "Recent";
}

// ─── Loading animation messages ───────────────────────────────────────
const LOADING_MESSAGES = [
  "Computing identity hash...",
  "Searching breach indices...",
  "Cross-referencing 960+ known breaches...",
  "Applying k-anonymity filter...",
  "Correlating domain exposure...",
];

function LoadingState({ email }) {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ marginBottom: "18px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "2px solid rgba(125,211,252,0.3)",
          borderTop: "2px solid var(--accent-ice)",
          margin: "0 auto 16px",
          animation: "spin 0.9s linear infinite",
        }} />
      </div>
      <p className="type-label" style={{ color: "var(--accent-ice)", marginBottom: "8px" }}>
        {email ? `Checking ${email}` : "Breach Intelligence"}
      </p>
      <p className="type-caption" style={{ color: "var(--text-muted)", minHeight: "20px" }}>
        {LOADING_MESSAGES[msgIdx]}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function BreachCard({ breach }) {
  const [expanded, setExpanded] = useState(false);
  const sev = (breach.severity || "medium").toLowerCase();
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.medium;

  return (
    <div style={{
      padding: "14px",
      borderRadius: "var(--radius-md)",
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      marginBottom: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span className="type-label" style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
              {breach.name || "Unknown Breach"}
            </span>
            <span style={{
              padding: "2px 7px",
              borderRadius: "var(--radius-pill)",
              background: `${colors.text}20`,
              color: colors.text,
              fontSize: "0.64rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {sev}
            </span>
            {breach.date && (
              <span className="type-micro" style={{ color: "var(--text-muted)" }}>
                {breach.date?.slice(0, 7)} · {timeAgo(breach.date)}
              </span>
            )}
          </div>
          {breach.recordCount && (
            <p className="type-caption" style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>
              {formatCount(breach.recordCount)} accounts compromised
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {(breach.dataExposed || breach.dataClasses || []).map((cls, i) => (
              <span key={i} style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                background: `${getDataclassColor(cls)}18`,
                color: getDataclassColor(cls),
                border: `1px solid ${getDataclassColor(cls)}40`,
                fontSize: "0.68rem",
                fontFamily: "var(--font-mono)",
              }}>
                {cls}
              </span>
            ))}
          </div>
        </div>
      </div>

      {breach.description && (
        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-secondary)", fontSize: "0.75rem",
              fontFamily: "var(--font-mono)", padding: 0,
            }}
          >
            {expanded ? "▲ Hide details" : "▼ Show details"}
          </button>
          {expanded && (
            <p className="type-caption" style={{ marginTop: "8px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {breach.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline SVG Icons ────────────────────────────────────────────────── */
const IconShieldX = ({ size = 28, color = "#fb7185" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </svg>
);

const IconShieldCheck = ({ size = 28, color = "#34d399" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconRadar = ({ size = 24, color = "#fbbf24" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" opacity="0.3" />
    <circle cx="12" cy="12" r="6" opacity="0.5" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const IconLock = ({ size = 10, color = "var(--text-muted)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const IconBulb = ({ size = 14, color = "#fbbf24" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}>
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
  </svg>
);

function PwnedState({ result }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const count = result.breaches?.length || 0;

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: "20px 16px 16px",
        background: "linear-gradient(135deg, rgba(255,51,102,0.12), rgba(251,113,133,0.06))",
        borderBottom: "1px solid rgba(255,51,102,0.15)",
        marginBottom: "16px",
        borderRadius: "var(--radius-md) var(--radius-md) 0 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(251,113,133,0.15)",
          }}>
            <IconShieldX />
          </div>
          <div>
            <p className="type-label" style={{ color: "#fb7185", fontSize: "1.05rem", letterSpacing: "0.04em" }}>EXPOSURE DETECTED</p>
            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
              Found in {count} data breach{count !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Breach cards */}
      <div style={{ padding: "0 4px" }}>
        {result.breaches?.map((b, i) => <BreachCard key={i} breach={b} />)}
      </div>

      {/* Domain-level exposure */}
      {result.domainMatch && result.metaMatches?.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <p className="type-label" style={{ marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            Service-Level Exposure (domain)
          </p>
          {result.metaMatches.slice(0, 4).map((b, i) => <BreachCard key={i} breach={b} />)}
        </div>
      )}

      {/* Actions accordion */}
      <div style={{
        marginTop: "14px",
        border: "1px solid rgba(251,191,36,0.2)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        <button
          type="button"
          onClick={() => setActionsOpen(!actionsOpen)}
          style={{
            width: "100%", display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "10px 14px",
            background: "rgba(251,191,36,0.06)", border: "none",
            cursor: "pointer", color: "#fbbf24",
            fontFamily: "var(--font-mono)", fontSize: "0.78rem",
          }}
        >
          <span><IconBulb /> Recommended Actions</span>
          <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>{actionsOpen ? "▲" : "▼"}</span>
        </button>
        {actionsOpen && (
          <div style={{ padding: "12px 14px", background: "rgba(251,191,36,0.03)" }}>
            {[
              "Change your password on every affected service immediately",
              "Enable Two-Factor Authentication (2FA) on all accounts",
              "Check if you reused this password anywhere else",
              "Use a password manager to generate unique passwords",
              "Watch for phishing emails referencing these services",
            ].map((action, i) => (
              <p key={i} className="type-caption" style={{
                color: "var(--text-secondary)", marginBottom: "6px",
                paddingLeft: "12px", borderLeft: "2px solid rgba(251,191,36,0.3)",
              }}>
                {action}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Privacy note */}
      <p className="type-micro" style={{
        marginTop: "12px", color: "var(--text-muted)",
        textAlign: "center", lineHeight: 1.4,
      }}>
        <IconLock /> {result.privacyNote}
      </p>
    </div>
  );
}

function CleanState({ result }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 16px" }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: "14px",
        boxShadow: "0 0 24px rgba(52,211,153,0.1)",
      }}>
        <IconShieldCheck size={26} />
      </div>
      <p className="type-label" style={{ color: "#34d399", fontSize: "0.95rem", marginBottom: "6px", letterSpacing: "0.04em" }}>
        No Breaches Found
      </p>
      <p className="type-caption" style={{ color: "var(--text-secondary)", marginBottom: "14px" }}>
        Not found in our breach database of {(result.totalBreachesSearched || 0).toLocaleString()} records
      </p>
      <p className="type-micro" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
        Checked against {result.totalBreachesSearched || "960"}+ known breaches ·
        Stay vigilant — not all breaches are public
      </p>
      <p className="type-micro" style={{ marginTop: "8px", color: "var(--text-muted)" }}>
        <IconLock /> {result.privacyNote}
      </p>
    </div>
  );
}

function PartialState({ result }) {
  const breaches = [
    ...(result.domainBreaches || []),
    ...(result.metaMatches || []),
  ].slice(0, 8);

  return (
    <div>
      <div style={{
        padding: "16px",
        background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.03))",
        borderBottom: "1px solid rgba(251,191,36,0.18)",
        marginBottom: "14px",
        borderRadius: "var(--radius-md) var(--radius-md) 0 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(251,191,36,0.1)",
          }}>
            <IconRadar />
          </div>
          <div>
            <p className="type-label" style={{ color: "#fbbf24", fontSize: "0.95rem" }}>
              Service-Level Exposure Detected
            </p>
            <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
              Your exact email was not found, but services matching your domain were breached.
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 4px" }}>
        {breaches.map((b, i) => <BreachCard key={i} breach={b} />)}
      </div>

      <p className="type-micro" style={{ marginTop: "10px", color: "var(--text-muted)", textAlign: "center" }}>
        Accounts on these platforms using this email domain may be at risk.
      </p>
      <p className="type-micro" style={{ marginTop: "6px", color: "var(--text-muted)", textAlign: "center" }}>
        <IconLock /> {result.privacyNote}
      </p>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────
export default function BreachPanel({ moduleMap, query, inputType }) {
  // Works for email, username, domain — the breach engine handles all types
  const target = query ? query.toLowerCase().trim() : null;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const checkedRef = useRef(null);

  useEffect(() => {
    if (!target || target === checkedRef.current) return;
    checkedRef.current = target;
    setLoading(true);
    setResult(null);
    setError(null);

    combinedBreachCheck(target)
      .then((res) => {
        setResult(res);
        setLoading(false);
        try {
          localStorage.setItem(
            `breach_result_${target}`,
            JSON.stringify({
              type: res.exactMatch && (res.breaches?.length || 0) > 0 ? "pwned"
                  : res.domainMatch ? "partial" : "clean",
              breachCount: res.breaches?.length || 0,
              domainBreachCount: 0,
            })
          );
        } catch {}
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [target]);

  if (!target) return null;




  return (
    <GlassCard style={{ padding: 0, overflow: "hidden", marginTop: "14px" }}>
      {/* Panel header */}
      <div style={{
        padding: "12px 16px 10px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p className="type-label">Breach Intelligence</p>
        <p className="type-caption" style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
          {target}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: "14px" }}>
        {loading && <LoadingState email={target} />}
        {error && (
          <p className="type-caption" style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>
            Unable to check breach data: {error}
          </p>
        )}
        {result && !loading && (() => {
          if (result.exactMatch && (result.breaches?.length || 0) > 0) {
            return <PwnedState result={result} />;
          }
          if (result.domainMatch && (result.domainBreaches?.length > 0 || result.metaMatches?.length > 0)) {
            return <PartialState result={result} />;
          }
          return <CleanState result={result} />;
        })()}
      </div>
    </GlassCard>
  );
}
