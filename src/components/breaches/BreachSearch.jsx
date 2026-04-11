"use client";

import { Search, Filter, X } from "lucide-react";

const SEVERITY_OPTIONS = [
  { value: "all", label: "ALL" },
  { value: "critical", label: "CRITICAL" },
  { value: "high", label: "HIGH" },
  { value: "moderate", label: "MODERATE" },
  { value: "low", label: "LOW" },
];

const DEFAULT_YEAR_OPTIONS = [
  { value: "all", label: "ALL YEARS" },
];

export default function BreachSearch({ value, onChange, severity, onSeverityChange, year, onYearChange, resultCount, onClear, yearOptions }) {
  const YEAR_OPTIONS = yearOptions?.length ? yearOptions : DEFAULT_YEAR_OPTIONS;
  return (
    <div
      style={{
        marginBottom: "var(--space-xl)",
      }}
    >
      {/* Search Input */}
      <div
        style={{
          position: "relative",
          maxWidth: "560px",
          margin: "0 auto var(--space-md)",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search breaches by name, keyword, or data type..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: "48px",
            paddingLeft: "44px",
            paddingRight: value ? "40px" : "16px",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "999px",
            fontFamily: "var(--font-display)",
            fontSize: "0.875rem",
            fontWeight: 300,
            color: "var(--text-primary)",
            outline: "none",
            transition: "border-color 150ms ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--border-hover)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border-subtle)";
          }}
        />
        {value && (
          <button
            onClick={onClear}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-md)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={14} style={{ color: "var(--text-muted)" }} />
          <span className="type-caption" style={{ color: "var(--text-muted)" }}>
            FILTER:
          </span>
        </div>

        {/* Severity Filter */}
        <div style={{ display: "flex", gap: "4px" }}>
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSeverityChange(opt.value)}
              style={{
                padding: "4px 12px",
                background:
                  severity === opt.value ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${
                  severity === opt.value ? "var(--border-active)" : "var(--border-subtle)"
                }`,
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-display)",
                fontSize: "0.625rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                color:
                  severity === opt.value ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        <div style={{ display: "flex", gap: "4px" }}>
          {YEAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onYearChange(opt.value)}
              style={{
                padding: "4px 12px",
                background:
                  year === opt.value ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${
                  year === opt.value ? "var(--border-active)" : "var(--border-subtle)"
                }`,
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-display)",
                fontSize: "0.625rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                color:
                  year === opt.value ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Result Count */}
        <span className="type-caption" style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
          {resultCount} BREACH{resultCount !== 1 ? "ES" : ""}
        </span>
      </div>
    </div>
  );
}
