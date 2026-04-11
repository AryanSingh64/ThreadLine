"use client";

import { useEffect, useRef, useState } from "react";
import GlassCard from "../ui/GlassCard";

export default function DomainPermsPanel({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const checkedRef = useRef(null);

  useEffect(() => {
    if (!domain || domain === checkedRef.current) return;
    checkedRef.current = domain;
    setLoading(true);
    setData(null);
    fetch(`/api/domain-perms?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [domain]);

  if (!domain) return null;

  return (
    <GlassCard style={{ padding: "14px", marginTop: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p className="type-label">Domain Permutations</p>
        {data && (
          <span className="type-micro" style={{ color: "var(--text-muted)" }}>
            {data.totalPermutations} variants checked
          </span>
        )}
      </div>

      {loading && (
        <p className="type-caption" style={{ color: "var(--text-muted)" }}>
          Generating and DNS-checking variants…
        </p>
      )}

      {data && !loading && (
        <>
          {/* Registered — potential typosquatters */}
          {data.registered?.length > 0 ? (
            <div>
              <p className="type-caption" style={{
                color: "#C97B6A",
                marginBottom: 8,
                letterSpacing: "0.06em",
              }}>
                ⚠ Registered variants ({data.registered.length}) — potential typosquatters
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {data.registered.map((r) => (
                  <div key={r.domain} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    background: "rgba(176,90,90,0.06)",
                    border: "1px solid rgba(176,90,90,0.2)",
                    borderRadius: "var(--radius-sm)",
                  }}>
                    <span className="type-mono" style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>
                      {r.domain}
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {r.ip && (
                        <span className="type-micro" style={{ color: "var(--text-muted)" }}>{r.ip}</span>
                      )}
                      <span style={{
                        padding: "2px 7px",
                        borderRadius: "var(--radius-pill)",
                        background: "rgba(176,90,90,0.12)",
                        color: "#C97B6A",
                        fontSize: "0.65rem",
                        fontFamily: "var(--font-mono)",
                      }}>
                        LIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No registered variants found */
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "rgba(74,140,106,0.05)",
              border: "1px solid rgba(74,140,106,0.18)",
              borderRadius: "var(--radius-sm)",
            }}>
              <span style={{ fontSize: "1rem" }}>✓</span>
              <div>
                <p className="type-caption" style={{ color: "#6BAF8D", fontWeight: 600 }}>
                  No live typosquatting domains detected
                </p>
                <p className="type-micro" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                  Checked {Math.min(40, data.totalPermutations)} of {data.totalPermutations} permutations — none are registered
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
