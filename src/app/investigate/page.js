"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ExportButton from "@/components/dashboard/ExportButton";
import FindingsPanel from "@/components/dashboard/FindingsPanel";
import GeoMapPanel from "@/components/dashboard/GeoMapPanel";
import ModuleStatusGrid from "@/components/dashboard/ModuleStatusGrid";
import OwnerReputationPanel from "@/components/dashboard/OwnerReputationPanel";
import ThreatMeter from "@/components/dashboard/ThreatMeter";
import SubdomainPanel from "@/components/dashboard/SubdomainPanel";
import DomainPermsPanel from "@/components/dashboard/DomainPermsPanel";
import NodeDetailPanel from "@/components/graph/NodeDetailPanel";
import ScanAnimation from "@/components/scan/ScanAnimation";
import SearchConsole from "@/components/search/SearchConsole";
import LiveTerminal from "@/components/terminal/LiveTerminal";
import GlassCard from "@/components/ui/GlassCard";
import UserBadge from "@/components/ui/UserBadge";
import BreachIntelCard from "@/components/dashboard/BreachIntelCard";
import HistoryPanel from "@/components/dashboard/HistoryPanel";
import TimelinePanel from "@/components/dashboard/TimelinePanel";
import { useInvestigation } from "@/hooks/useInvestigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SpecialText } from "@/components/ui/SpecialText";
import InlineHistoryPanel from "@/components/dashboard/InlineHistoryPanel";

const IntelGraph = dynamic(() => import("@/components/graph/IntelGraph"), {
  ssr: false,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

function detectType(value) {
  let input = String(value || "").trim().toLowerCase();
  if (!input) return "unknown";
  // Strip URL scheme and path — treat as domain
  if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("ftp://")) {
    input = input.replace(/^https?:\/\/|^ftp:\/\//i, "").split("/")[0].split("?")[0];
  }
  if (EMAIL_REGEX.test(input)) return "email";
  if (IPV4_REGEX.test(input)) return "ip";
  if (DOMAIN_REGEX.test(input)) return "domain";
  return "username";
}

export default function InvestigatePage() {
  const router = useRouter();
  const [agentName, , nameReady] = useLocalStorage("threadline_agent_name", "");
  const [archetype, , archetypeReady] = useLocalStorage("threadline_archetype", "");
  const [query, setQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const mode = "deep"; // Always deep mode

  const {
    running,
    statusMessages,
    moduleList,
    graph,
    score,
    explanation,
    summary,
    inputType,
    error,
    progress,
    startInvestigation,
    stop,
  } = useInvestigation();

  const detectedType = useMemo(() => detectType(query), [query]);
  const moduleMap = useMemo(
    () =>
      moduleList.reduce((acc, item) => {
        acc[item.module] = item;
        return acc;
      }, {}),
    [moduleList]
  );

  const geoData = moduleMap.ipGeoApi?.data || null;
  const asnData = moduleMap.asnLookup?.data || null;
  const datasetMatch = moduleMap.datasetMatch || null;
  const subdomainCount = moduleMap.subdomain?.data?.discovered?.length || 0;
  const portCount = moduleMap.shodanInternetDB?.data?.ports?.length || 0;

  useEffect(() => {
    if (nameReady && archetypeReady && (!agentName || !archetype)) {
      router.replace("/");
    }
  }, [agentName, archetype, archetypeReady, nameReady, router]);

  if (!nameReady || !archetypeReady) {
    return <div style={{ minHeight: "100vh", background: "var(--bg-void)" }} />;
  }

  if (!agentName || !archetype) {
    return <div style={{ minHeight: "100vh", background: "var(--bg-void)" }} />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSelectedNode(null);
    // Normalise URLs to bare hostname before investigating
    let q = query.trim();
    if (/^https?:\/\//i.test(q) || /^ftp:\/\//i.test(q)) {
      q = q.replace(/^https?:\/\/|^ftp:\/\//i, "").split("/")[0].split("?")[0];
    }
    startInvestigation(q, mode);
  };

  return (
    <div className="page-shell" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <UserBadge name={agentName} archetype={archetype} />
      {summary && (
        <div className="investigate-export-anchor">
          <ExportButton compact />
        </div>
      )}
      <ScanAnimation running={running} messages={statusMessages} progress={progress} />

      <div className="investigate-wrapper">
        {/* ─── Vertically + horizontally centered hero ─── */}
        <div style={{
          minHeight: summary ? "auto" : "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: summary ? "var(--space-xl)" : 0,
          paddingBottom: summary ? "var(--space-lg)" : 0,
          transition: "min-height 400ms ease",
        }}>
          {/* Brand title */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
            <h1 style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 300,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: 8,
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
            }}>
              <SpecialText inView once={false} speed={18}>
                ThreadLine
              </SpecialText>
            </h1>
            <p className="type-micro" style={{ color: "var(--text-muted)", letterSpacing: "0.18em" }}>
              Intelligence Command Center
            </p>
          </div>

          {/* Search + history — same max-width, centered */}
          <div style={{ width: "100%", maxWidth: 560 }}>
            <SearchConsole
              value={query}
              onChange={setQuery}
              inputType={inputType || detectedType}
              onSubmit={handleSubmit}
              running={running}
            />
            <InlineHistoryPanel onSelect={(q) => { setQuery(q); startInvestigation(q, mode); }} />
          </div>
        </div>

        {running && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <button
              type="button"
              onClick={stop}
              style={{
                padding: "6px 18px",
                background: "rgba(255,51,102,0.12)",
                border: "1px solid rgba(255,51,102,0.35)",
                borderRadius: "var(--radius-pill)",
                color: "#fb7185",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              ✕ Stop Investigation
            </button>
          </div>
        )}

        {error ? (
          <p style={{ marginTop: "10px", color: "var(--accent-ember)" }}>{error}</p>
        ) : null}

        {summary ? (
          <div id="dashboard-report">
            <div style={{ marginTop: "var(--space-lg)" }}>
              <OwnerReputationPanel
                query={summary.query}
                inputType={summary.inputType}
                asnData={asnData}
                datasetMatch={datasetMatch}
                score={score}
              />
            </div>

            <div className="investigation-layout">
              <div className="investigation-left">
                <HistoryPanel onSelect={(q) => { setQuery(q); startInvestigation(q, mode); }} />
                <LiveTerminal messages={statusMessages} height="360px" />

              </div>

              <div className="investigation-center">
                <IntelGraph graph={graph} onNodeClick={setSelectedNode} height={380} />
                <FindingsPanel moduleMap={moduleMap} />
                <SubdomainPanel moduleMap={moduleMap} />
                {(summary?.inputType === "domain" || summary?.inputType === "email") && (
                  <DomainPermsPanel
                    domain={summary?.inputType === "email" ? summary?.query?.split("@")[1] : summary?.query}
                  />
                )}
                <TimelinePanel moduleMap={moduleMap} query={summary?.query} inputType={summary?.inputType} />
                <NodeDetailPanel node={selectedNode} mode={summary.mode || mode} />
                <GlassCard style={{ padding: "14px" }}>
                  <p className="type-label" style={{ marginBottom: "10px" }}>
                    AI Analysis
                  </p>
                  <p style={{ color: "var(--text-primary)", lineHeight: 1.7, fontSize: "0.9rem" }}>
                    {explanation || "Awaiting explanation..."}
                  </p>
                </GlassCard>
              </div>

              <div className="investigation-right">
                <ThreatMeter score={score} />
                <GeoMapPanel geoData={geoData} />
                <GlassCard style={{ padding: "14px" }}>
                  <p className="type-label" style={{ marginBottom: "10px" }}>
                    Domain Intel
                  </p>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
                      Subdomains: <span style={{ color: "var(--text-primary)" }}>{subdomainCount}</span>
                    </p>
                    <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
                      Open Ports: <span style={{ color: "var(--text-primary)" }}>{portCount}</span>
                    </p>
                    <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
                      Geo Provider:{" "}
                      <span style={{ color: "var(--text-primary)" }}>
                        {geoData?.provider || "N/A"}
                      </span>
                    </p>
                  </div>
                </GlassCard>
                <BreachIntelCard query={summary?.query} inputType={summary?.inputType} />
                <ModuleStatusGrid moduleList={moduleList} compact />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
