"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Database, Shield, Users, Calendar } from "lucide-react";
import BreachCard from "@/components/breaches/BreachCard";
import BreachSearch from "@/components/breaches/BreachSearch";
import UserBadge from "@/components/ui/UserBadge";
import GlassCard from "@/components/ui/GlassCard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import breachesData from "@data/breaches_catalog.json";

function sortBreachesByDate(breaches) {
  return [...breaches].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function BreachesPage() {
  const router = useRouter();
  const [agentName, , nameReady] = useLocalStorage("threadline_agent_name", "");
  const [archetype, , archetypeReady] = useLocalStorage("threadline_archetype", "");

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const filteredBreaches = useMemo(() => {
    let result = breachesData;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.compromisedData.some((d) => d.toLowerCase().includes(q)) ||
          (b.source && b.source.toLowerCase().includes(q))
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      result = result.filter((b) => b.severity === severityFilter);
    }

    // Year filter
    if (yearFilter !== "all") {
      result = result.filter((b) => b.year === yearFilter);
    }

    return sortBreachesByDate(result);
  }, [searchQuery, severityFilter, yearFilter]);

  // Total pwned count from real pwnCount fields
  const totalPwned = useMemo(() => {
    return breachesData.reduce((sum, b) => sum + (b.pwnCount || 0), 0);
  }, []);

  // Date range from actual data
  const dateRange = useMemo(() => {
    const years = breachesData
      .map((b) => b.year)
      .filter((y) => y && y !== "Unknown")
      .map(Number);
    if (!years.length) return { min: "?", max: "?" };
    return { min: String(Math.min(...years)), max: String(Math.max(...years)) };
  }, []);

  const totalBreaches = breachesData.length;
  const verifiedBreaches = breachesData.filter((b) => b.isVerified !== false).length;

  // Dynamic year filter options from actual data
  const yearOptions = useMemo(() => {
    const years = [...new Set(
      breachesData.map((b) => b.year).filter((y) => y && y !== "Unknown")
    )].sort((a, b) => Number(b) - Number(a)).slice(0, 8);
    return [
      { value: "all", label: "ALL YEARS" },
      ...years.map((y) => ({ value: y, label: y })),
    ];
  }, []);

  if (!nameReady || !archetypeReady || !agentName || !archetype) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-void)" }}>
        <div style={{ padding: "var(--space-lg)" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={14} />
            BACK TO AUTH
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            color: "var(--text-muted)",
          }}
        >
          <Shield size={48} style={{ marginBottom: "var(--space-md)", opacity: 0.3 }} />
          <p className="type-label">Authentication required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <UserBadge name={agentName} archetype={archetype} />

      <div className="page-container" style={{ maxWidth: "800px", padding: "var(--space-3xl) 24px" }}>
        {/* Back Button */}
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <button
            onClick={() => router.push("/investigate")}
            style={{
              background: "none",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--border-hover)";
              e.target.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--border-subtle)";
              e.target.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowLeft size={14} />
            BACK TO INVESTIGATE
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
          <p className="type-label" style={{ marginBottom: "var(--space-md)", color: "var(--text-muted)" }}>
            Threat Intelligence Database
          </p>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: "var(--space-md)",
            }}
          >
            Breach
            <span style={{ fontWeight: 700, fontStyle: "italic" }}> Database</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "480px", margin: "0 auto" }}>
            Indexed breach records and stealer log compilations. Search across known incidents to understand exposure patterns.
          </p>
        </div>

        {/* Stats Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "var(--space-md)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <GlassCard style={{ padding: "var(--space-md)", textAlign: "center" }}>
            <Database size={18} style={{ color: "var(--accent-ice)", marginBottom: "6px" }} />
            <p className="type-label" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
              Total Breaches
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {totalBreaches.toLocaleString()}
            </p>
            <p className="type-micro" style={{ color: "var(--text-muted)" }}>
              {verifiedBreaches.toLocaleString()} verified HIBP records
            </p>
          </GlassCard>

          <GlassCard style={{ padding: "var(--space-md)", textAlign: "center" }}>
            <Users size={18} style={{ color: "var(--accent-ember)", marginBottom: "6px" }} />
            <p className="type-label" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
              Emails Exposed
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {totalPwned >= 1_000_000_000
                ? `${(totalPwned / 1_000_000_000).toFixed(1)}B`
                : `${(totalPwned / 1_000_000).toFixed(0)}M`}
            </p>
            <p className="type-micro" style={{ color: "var(--text-muted)" }}>
              across all records
            </p>
          </GlassCard>

          <GlassCard style={{ padding: "var(--space-md)", textAlign: "center" }}>
            <Calendar size={18} style={{ color: "var(--accent-signal)", marginBottom: "6px" }} />
            <p className="type-label" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
              Date Range
            </p>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {dateRange.min} — {dateRange.max}
            </p>
            <p className="type-micro" style={{ color: "var(--text-muted)" }}>
              {totalBreaches} breach incidents
            </p>
          </GlassCard>
        </div>

        {/* Search & Filters */}
        <BreachSearch
          value={searchQuery}
          onChange={setSearchQuery}
          severity={severityFilter}
          onSeverityChange={setSeverityFilter}
          year={yearFilter}
          onYearChange={setYearFilter}
          resultCount={filteredBreaches.length}
          onClear={() => setSearchQuery("")}
          yearOptions={yearOptions}
        />

        {/* Breach List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {filteredBreaches.length === 0 ? (
            <GlassCard style={{ padding: "var(--space-xl)", textAlign: "center" }}>
              <Shield size={32} style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)", opacity: 0.4 }} />
              <p className="type-label" style={{ color: "var(--text-muted)" }}>
                No breaches match your filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSeverityFilter("all");
                  setYearFilter("all");
                }}
                style={{
                  marginTop: "var(--space-md)",
                  background: "none",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 14px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Clear All Filters
              </button>
            </GlassCard>
          ) : (
            filteredBreaches.map((breach) => (
              <BreachCard key={breach.id} breach={breach} />
            ))
          )}
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: "var(--space-2xl)", textAlign: "center" }}>
          <p className="type-micro" style={{ color: "var(--text-muted)" }}>
            Data sourced from Have I Been Pwned (HIBP) public breach database.
            <br />
            {totalBreaches} verified breach incidents · {(totalPwned / 1_000_000_000).toFixed(1)}B accounts exposed.
          </p>
        </div>
      </div>
    </div>
  );
}
