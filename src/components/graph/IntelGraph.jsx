"use client";

import { hierarchy, select, tree, zoom, zoomIdentity } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "../ui/GlassCard";

const CATEGORY_ORDER = [
  "services",
  "issues",
  "infrastructure",
  "location",
  "identity",
  "leads",
];

const CATEGORY_LABELS = {
  services: "Services",
  issues: "Issues",
  infrastructure: "Infrastructure",
  location: "Location",
  identity: "Identity",
  leads: "Other Leads",
};

const CATEGORY_COLORS = {
  services: "#a78bfa",
  issues: "#fb7185",
  infrastructure: "#7dd3fc",
  location: "#34d399",
  identity: "#fbbf24",
  leads: "#9ca3af",
};

const NODE_COLORS = {
  email: "#00ff88",
  domain: "#a855f7",
  subdomain: "#7e55bb",
  ip: "#ff3366",
  username: "#ffaa00",
  platform: "#e8e8e8",
  dataset_match: "#ff3366",
  pattern_flag: "#ffaa00",
  dns_record: "#7dd3fc",
  geolocation: "#34d399",
  tech: "#7dd3fc",
  category: "#94a3b8",
};

function colorFor(node) {
  if (!node) return "#9ca3af";
  if (node.type === "category") {
    return CATEGORY_COLORS[node.categoryKey] || NODE_COLORS.category;
  }
  if (node.category === "critical") return "#fb7185";
  return NODE_COLORS[node.type] || "#9ca3af";
}

function radiusFor(node) {
  if (!node) return 6;
  if (String(node.id || "").startsWith("input:")) return 9;
  if (node.type === "category") return 8;
  if (node.type === "pattern_flag" || node.type === "dataset_match") return 7;
  if (node.type === "platform") return 5.5;
  return 6;
}

// Maps raw technical labels → human-readable descriptions shown on graph nodes
const LABEL_MAP = {
  top_1m_presence:       "Top 1M Website Presence",
  breach_entity_context: "Breach Database Match",
  security_csv:          "Threat Intelligence Hit",
  phishtank_csv:         "Phishing Database Match",
  betting_watchlist:     "Illegal Betting Watchlist",
  "Unknown registrar":   "Unverified Domain Registrar",
  "missing_https":       "No HTTPS Detected",
  "missing_hsts":        "Missing HSTS Header",
  "missing_csp":         "Missing Content Security Policy",
};

function humanizeLabel(raw) {
  if (!raw) return "Unknown";
  // Direct lookup
  if (LABEL_MAP[raw]) return LABEL_MAP[raw];
  // Port nodes
  const portMatch = raw.match(/^[Pp]ort\s+(\d+)$/);
  if (portMatch) {
    const p = portMatch[1];
    const portNames = { 80:"HTTP", 443:"HTTPS", 22:"SSH", 21:"FTP", 25:"SMTP", 3306:"MySQL", 5432:"PostgreSQL", 6379:"Redis", 27017:"MongoDB" };
    return portNames[p] ? `${portNames[p]} Port ${p} Open` : `Port ${p} Open`;
  }
  // AS number nodes e.g. "AS15169 Google LLC"
  if (/^AS\d+/.test(raw)) return `Hosted on: ${raw.replace(/^AS\d+\s*/,"") || raw}`;
  // Google Trust Services cert age e.g. "Google Trust Services (18d)"
  if (raw.includes("Trust Services") || raw.includes("Let's Encrypt")) {
    const ageMatch = raw.match(/\((\d+)d\)/);
    const age = ageMatch ? ` — ${ageMatch[1]} days old` : "";
    if (parseInt(ageMatch?.[1] || 999) < 30) return `⚠ New SSL Cert${age} (phishing risk)`;
    return `SSL Certificate: ${raw.replace(/\(\d+d\)/,"").trim()}`;
  }
  // Pattern analysis flags e.g. "Pattern matched: [a-z]{3,}[0-9]{4,}"
  if (raw.startsWith("Pattern matched:")) return "Suspicious Naming Pattern";
  if (raw.toLowerCase().includes("leetspeak")) return "Leetspeak Obfuscation Detected";
  if (raw.toLowerCase().includes("typosquat")) return "Typosquatting Pattern";
  if (raw.toLowerCase().includes("phishing keyword")) return "Phishing Keyword Present";
  if (raw.toLowerCase().includes("disposable")) return "Disposable Email Provider";
  if (raw.toLowerCase().includes("suspicious tld")) return "Suspicious Domain Extension";
  return raw.length > 44 ? `${raw.slice(0, 44)}…` : raw;
}

function cleanLabel(label, fallback) {
  return humanizeLabel(String(label || fallback || "").trim());
}

function rootLabel(node) {
  const value = String(node?.label || node?.id || "").trim();
  if (value.startsWith("input:")) return value.replace(/^input:/, "");
  return value || "Target";
}

function isIssueNode(node) {
  const text = `${node?.label || ""} ${node?.id || ""}`.toLowerCase();
  return (
    node?.type === "pattern_flag" ||
    node?.type === "dataset_match" ||
    text.includes("breach") ||
    text.includes("phish") ||
    text.includes("suspicious") ||
    text.includes("unknown") ||
    text.includes("missing") ||
    text.includes("port")
  );
}

function categoryForNode(node) {
  if (!node) return "leads";
  if (node.type === "platform" || String(node.id || "").startsWith("provider:")) return "services";
  if (isIssueNode(node)) return "issues";
  if (node.type === "geolocation") return "location";
  if (node.type === "email" || node.type === "username") return "identity";
  if (
    node.type === "dns_record" ||
    node.type === "subdomain" ||
    node.type === "domain" ||
    node.type === "ip" ||
    node.type === "tech"
  ) {
    return "infrastructure";
  }
  return "leads";
}

function buildTreeModel(nodes) {
  if (!nodes?.length) return null;

  const root =
    nodes.find((node) => String(node.id || "").startsWith("input:")) ||
    nodes.find((node) => node.type === "email" || node.type === "domain") ||
    nodes[0];

  if (!root) return null;

  const buckets = new Map(CATEGORY_ORDER.map((key) => [key, []]));
  nodes.forEach((node) => {
    if (!node || node.id === root.id) return;
    const key = categoryForNode(node);
    buckets.get(key)?.push(node);
  });

  const children = CATEGORY_ORDER.map((key) => {
    const list = buckets.get(key) || [];
    if (!list.length) return null;
    return {
      id: `category:${key}`,
      label: `${CATEGORY_LABELS[key]} (${list.length})`,
      type: "category",
      categoryKey: key,
      children: list.map((item) => ({
        id: item.id,
        label: cleanLabel(item.label, item.id),
        type: item.type,
        sourceNode: item,
      })),
    };
  }).filter(Boolean);

  return {
    id: root.id,
    label: rootLabel(root),
    type: root.type || "domain",
    sourceNode: root,
    children,
  };
}

function branchPath(source, target) {
  const midX = source.x + (target.x - source.x) * 0.52;
  return `M${source.x},${source.y} C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
}

export default function IntelGraph({ graph, onNodeClick, height = 360 }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [width, setWidth] = useState(760);
  const [zoomTransform, setZoomTransform] = useState(zoomIdentity);
  const [hoveredNodeId, setHoveredNodeId] = useState("");
  const [activeNodeId, setActiveNodeId] = useState("");

  const internalHeight = Math.max(280, Number(height) || 360);
  const nodes = useMemo(() => graph?.nodes || [], [graph?.nodes]);
  const treeModel = useMemo(() => buildTreeModel(nodes), [nodes]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect?.width || 0);
      if (nextWidth > 220) setWidth(nextWidth - 2);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    const behavior = zoom()
      .scaleExtent([0.45, 3.2])
      .on("zoom", (event) => setZoomTransform(event.transform));

    zoomRef.current = behavior;
    svg.call(behavior);
    svg.on("dblclick.zoom", null);
    return () => svg.on(".zoom", null);
  }, []);

  const layout = useMemo(() => {
    if (!treeModel) return null;

    const root = hierarchy(treeModel);
    tree()
      .nodeSize([34, 220])
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.35))(root);

    const descendants = root.descendants();
    const links = root.links();

    const minY = Math.min(...descendants.map((d) => d.x));
    const maxY = Math.max(...descendants.map((d) => d.x));
    const maxX = Math.max(...descendants.map((d) => d.y));

    const paddingTop = 34;
    const paddingLeft = 30;
    const contentHeight = Math.max(internalHeight, maxY - minY + paddingTop * 2 + 6);
    const contentWidth = Math.max(width, maxX + paddingLeft + 320);

    const nodePoints = descendants.map((d) => ({
      id: d.data.id,
      x: d.y + paddingLeft,
      y: d.x - minY + paddingTop,
      data: d.data,
      depth: d.depth,
    }));

    const linkPoints = links.map((l) => {
      const source = {
        x: l.source.y + paddingLeft,
        y: l.source.x - minY + paddingTop,
      };
      const target = {
        x: l.target.y + paddingLeft,
        y: l.target.x - minY + paddingTop,
      };
      return { source, target, key: `${l.source.data.id}->${l.target.data.id}` };
    });

    return {
      nodes: nodePoints,
      links: linkPoints,
      contentHeight,
      contentWidth,
    };
  }, [internalHeight, treeModel, width]);

  const zoomBy = (factor) => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(180).call(zoomRef.current.scaleBy, factor);
  };

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(200).call(zoomRef.current.transform, zoomIdentity);
  };

  return (
    <GlassCard style={{ padding: "14px", overflow: "hidden", position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <p className="type-label">Intelligence Graph</p>
        <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
          Root tree view: Target - Branches - Leads
        </p>
      </div>

      <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout?.contentWidth || width} ${layout?.contentHeight || internalHeight}`}
          style={{
            width: "100%",
            height: `${internalHeight}px`,
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(125, 211, 252, 0.18)",
            background:
              "radial-gradient(circle at 24% 50%, rgba(125, 211, 252, 0.08), rgba(10,10,10,0.1) 40%, rgba(10,10,10,0.76) 100%)",
          }}
        >
          <g transform={zoomTransform.toString()}>
            {layout?.links.map((link) => (
              <path
                key={link.key}
                d={branchPath(link.source, link.target)}
                fill="none"
                stroke="rgba(148,163,184,0.34)"
                strokeWidth="1.15"
              />
            ))}

            {layout?.nodes.map((node) => {
              const isFocused = activeNodeId === node.id || hoveredNodeId === node.id;
              const circleColor = colorFor(node.data);
              const isCategory = node.data.type === "category";
              const sourceNode = node.data.sourceNode || null;
              const canClick = Boolean(sourceNode);

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    if (!canClick) return;
                    setActiveNodeId(node.id);
                    onNodeClick?.(sourceNode);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId("")}
                  style={{ cursor: canClick ? "pointer" : "default" }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radiusFor(node.data)}
                    fill={circleColor}
                    stroke={isFocused ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.22)"}
                    strokeWidth={isFocused ? 1.6 : 1}
                  />
                  <text
                    x={node.x + (isCategory ? 11 : 9)}
                    y={node.y + 4}
                    fill={
                      isCategory
                        ? "color-mix(in srgb, var(--text-primary) 92%, white)"
                        : isFocused
                          ? "var(--text-primary)"
                          : "var(--text-secondary)"
                    }
                    fontSize={isCategory ? "11" : "10"}
                    fontFamily="var(--font-mono)"
                    fontWeight={isCategory ? 600 : 400}
                  >
                    {cleanLabel(node.data.label, node.id)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            display: "inline-flex",
            gap: "6px",
            zIndex: 2,
          }}
        >
          <button type="button" className="graph-zoom-btn" onClick={() => zoomBy(1.2)}>
            +
          </button>
          <button type="button" className="graph-zoom-btn" onClick={() => zoomBy(0.82)}>
            -
          </button>
          <button type="button" className="graph-zoom-btn" onClick={resetZoom}>
            Reset
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
