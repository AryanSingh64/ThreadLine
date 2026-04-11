"use client";

import { Shield, ShieldAlert, ShieldCheck, Calendar, Database, Users } from "lucide-react";
import { motion } from "framer-motion";

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    label: "CRITICAL",
    color: "var(--accent-ember)",
    glow: "0 0 12px rgba(248,113,113,0.3)",
  },
  high: {
    icon: Shield,
    label: "HIGH",
    color: "var(--accent-warn)",
    glow: "0 0 12px rgba(251,191,36,0.3)",
  },
  moderate: {
    icon: ShieldCheck,
    label: "MODERATE",
    color: "var(--accent-signal)",
    glow: "0 0 12px rgba(52,211,153,0.3)",
  },
};

function StatBadge({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <Icon size={12} style={{ color: "var(--text-muted)" }} />
      <span className="type-caption" style={{ color: "var(--text-secondary)" }}>
        {label}:
      </span>
      <span
        className="type-caption"
        style={{ color: "var(--text-primary)", fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}

export default function BreachCard({ breach }) {
  const sev = severityConfig[breach.severity] || severityConfig.moderate;
  const Icon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        border: `1px solid var(--border-subtle)`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: sev.color,
          boxShadow: sev.glow,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "var(--space-md)",
          gap: "var(--space-md)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Icon size={18} style={{ color: sev.color }} />
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {breach.name}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={12} style={{ color: "var(--text-muted)" }} />
              <span className="type-caption" style={{ color: "var(--text-secondary)" }}>
                {breach.month} {breach.year}
              </span>
            </div>
            <div
              style={{
                padding: "2px 8px",
                background: `${sev.color}15`,
                border: `1px solid ${sev.color}30`,
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span
                className="type-micro"
                style={{ color: sev.color, fontWeight: 700, letterSpacing: "0.15em" }}
              >
                {sev.label}
              </span>
            </div>
            {breach.simulated && (
              <div
                style={{
                  padding: "2px 8px",
                  background: "rgba(125,211,252,0.1)",
                  border: "1px solid rgba(125,211,252,0.2)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span
                  className="type-micro"
                  style={{ color: "var(--accent-ice)", fontWeight: 600, letterSpacing: "0.1em" }}
                >
                  SIMULATED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          lineHeight: 1.7,
          marginBottom: "var(--space-md)",
        }}
      >
        {breach.description}
      </p>

      {/* Stats Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "var(--space-md)",
        }}
      >
        {breach.recordCount && (
          <StatBadge icon={Database} label="Records" value={breach.recordCount} />
        )}
        {breach.uniqueEmails && (
          <StatBadge icon={Users} label="Emails" value={breach.uniqueEmails} />
        )}
        {breach.uniquePasswords && (
          <StatBadge icon={Shield} label="Passwords" value={breach.uniquePasswords} />
        )}
      </div>

      {/* Compromised Data Tags */}
      <div>
        <p className="type-label" style={{ marginBottom: "8px", color: "var(--text-muted)" }}>
          Compromised Data
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {breach.compromisedData.map((item) => (
            <span
              key={item}
              style={{
                padding: "4px 10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                letterSpacing: "0.05em",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
