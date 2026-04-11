"use client";

import { ChevronRight, Search } from "lucide-react";
import InputTypeIndicator from "./InputTypeIndicator";

export default function SearchConsole({ value, onChange, inputType, onSubmit, running }) {
  return (
    <div style={{ width: "100%", maxWidth: "760px", margin: "0 auto" }}>
      <form onSubmit={onSubmit}>
        <div className="search-bar" style={{ margin: "0 auto" }}>
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Enter email, domain, username or IP..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            className="search-submit"
            disabled={!value.trim() || running}
            aria-label="Send query"
          >
            <span>{running ? "Scanning" : "Investigate"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </form>

      <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "8px" }}>
        {inputType && inputType !== "unknown" ? <InputTypeIndicator type={inputType} /> : null}
      </div>

      <p
        className="type-body"
        style={{
          marginTop: "6px",
          color: "var(--text-muted)",
          textAlign: "center",
          fontSize: "0.78rem",
          maxWidth: "540px",
          marginInline: "auto",
        }}
      >
        Live OSINT · DNS · Certificate Transparency · Platform Enumeration · Breach Intelligence
      </p>
    </div>
  );
}
