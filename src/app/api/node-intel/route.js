import dns from "dns/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Node type definitions with human explanations ─────────────────────
const NODE_INTEL = {
  domain: {
    label: "Domain",
    icon: "globe",
    color: "#7dd3fc",
    description: (id) => `A registered internet domain. Domains are the human-readable addresses mapped to IP infrastructure. Investigating this reveals hosting provider, DNS configuration, registration history, and any subdomains.`,
  },
  subdomain: {
    label: "Subdomain",
    icon: "branch",
    color: "#a5b4fc",
    description: (id) => `A child DNS record under the root domain. Subdomains often expose internal services, admin panels, staging environments, or API endpoints that weren't meant to be public.`,
  },
  ip: {
    label: "IP Address",
    icon: "server",
    color: "#fb923c",
    description: (id) => `A raw IPv4 address tied to internet infrastructure. Can be traced to a hosting provider, data center, or residential ISP. Cross-referenced with threat intelligence for known malicious activity.`,
  },
  port: {
    label: "Open Port",
    icon: "plug",
    color: "#f43f5e",
    description: (id) => `An open network port discovered on the target's infrastructure. Open ports are potential attack vectors — each one represents a running service that could be exploited if unpatched or misconfigured.`,
  },
  pattern_flag: {
    label: "Pattern Flag",
    icon: "alert",
    color: "#fbbf24",
    description: (id) => `A behavioral or structural anomaly detected during analysis. Pattern flags indicate suspicious relationships between data points — like a port number associated with proxies, malware C2 servers, or known scanning tools.`,
  },
  platform: {
    label: "Platform Account",
    icon: "user",
    color: "#34d399",
    description: (id) => `A confirmed or inferred account on a third-party platform. Discovered through username enumeration across 200+ services. Each platform account expands the target's digital footprint.`,
  },
  email: {
    label: "Email Address",
    icon: "mail",
    color: "#e879f9",
    description: (id) => `An email address associated with the target. Emails are primary identifiers that link accounts, breach records, and registration data across services.`,
  },
  breach: {
    label: "Data Breach",
    icon: "shield-x",
    color: "#fb7185",
    description: (id) => `A known data breach incident that exposed target information. Each breach record contains the platform, date, number of affected accounts, and categories of exposed data.`,
  },
  asn: {
    label: "Autonomous System",
    icon: "network",
    color: "#60a5fa",
    description: (id) => `An Autonomous System Number representing a network that controls a block of IP addresses. ASN ownership reveals the internet infrastructure provider — CDN, hosting company, ISP, or cloud provider.`,
  },
  ssl: {
    label: "SSL Certificate",
    icon: "lock",
    color: "#4ade80",
    description: (id) => `An SSL/TLS certificate associated with the target domain. Certificates reveal hostnames, issuing authority, validity periods, and sometimes internal infrastructure names through Subject Alternative Names (SANs).`,
  },
  ptr: {
    label: "Reverse DNS",
    icon: "arrow-left",
    color: "#94a3b8",
    description: (id) => `A PTR (pointer) record resolving an IP address back to a hostname. Reveals the hosting provider's naming convention and can expose internal server names or datacenter locations.`,
  },
  provider: {
    label: "Hosting Provider",
    icon: "cloud",
    color: "#38bdf8",
    description: (id) => `The infrastructure provider hosting the target's services. Knowing the provider enables more targeted vulnerability research and helps identify shared hosting, CDN usage, or cloud service dependency.`,
  },
};

// Well-known port intelligence database
const PORT_INTEL = {
  21: { service: "FTP", risk: "high", note: "File Transfer Protocol. Unencrypted. Commonly exploited for anonymous access or credential brute-force." },
  22: { service: "SSH", risk: "medium", note: "Secure Shell. Encrypted remote access. Exposed SSH is a common target for automated brute-force attacks." },
  23: { service: "Telnet", risk: "critical", note: "Telnet. Completely unencrypted. Any exposure of this port is a severe misconfiguration." },
  25: { service: "SMTP", risk: "medium", note: "Email sending. Open SMTP can be abused for spam relay if misconfigured." },
  53: { service: "DNS", risk: "medium", note: "Domain Name System. Open resolvers can be abused for amplification attacks and DNS reconnaissance." },
  80: { service: "HTTP", risk: "low", note: "Unencrypted web traffic. Should be redirected to HTTPS. Running services here are visible to passive eavesdroppers." },
  443: { service: "HTTPS", risk: "low", note: "Encrypted web traffic. Standard for web services. Check SSL certificate validity and cipher strength." },
  445: { service: "SMB", risk: "critical", note: "Windows file sharing. Notorious exploitation surface — EternalBlue/WannaCry ransomware spread via this port." },
  1433: { service: "MSSQL", risk: "high", note: "Microsoft SQL Server database. Exposed databases are a primary target for data theft." },
  2082: { service: "cPanel HTTP", risk: "medium", note: "cPanel web hosting control panel over HTTP. Should never be internet-facing." },
  2083: { service: "cPanel HTTPS", risk: "medium", note: "cPanel web hosting control panel over HTTPS. Legitimate but should be access-controlled." },
  2086: { service: "WHM HTTP", risk: "high", note: "Web Host Manager — root-level server administration panel. If exposed publicly, this is a critical finding. WHM provides full server control including all hosted sites." },
  2087: { service: "WHM HTTPS", risk: "high", note: "Web Host Manager over HTTPS. Root-level hosting administration panel. Exposure indicates a cPanel/WHM hosting environment." },
  2222: { service: "Alt-SSH", risk: "medium", note: "SSH on a non-standard port. Often moved here to evade automated scanners. Still requires the same hardening as port 22." },
  3306: { service: "MySQL", risk: "high", note: "MySQL database server. Exposed databases are a primary attack target. Should never be internet-facing without strict access controls." },
  3389: { service: "RDP", risk: "critical", note: "Windows Remote Desktop. One of the most actively attacked surfaces on the internet. Constant brute-force and BlueKeep-style exploit attempts." },
  5432: { service: "PostgreSQL", risk: "high", note: "PostgreSQL database. Exposed databases enable direct data exfiltration." },
  6379: { service: "Redis", risk: "critical", note: "Redis in-memory database. Default Redis has no authentication — any exposed Redis server is likely readable by anyone." },
  8080: { service: "HTTP Alt", risk: "low", note: "Alternative HTTP port. Often used for development servers, reverse proxies, or web applications." },
  8443: { service: "HTTPS Alt", risk: "low", note: "Alternative HTTPS port. Same risk profile as 443 — check certificate and running application." },
  9200: { service: "Elasticsearch", risk: "critical", note: "Elasticsearch REST API. Default configuration has no authentication. Tens of thousands of Elasticsearch instances have been ransacked due to public exposure." },
  27017: { service: "MongoDB", risk: "critical", note: "MongoDB database. Default config has no authentication. A publicly exposed MongoDB is almost certainly a breach waiting to happen." },
};

function normalizeDomain(value) {
  return String(value || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").split("/")[0];
}

function extractPortAndIp(nodeId) {
  // Format: port:IP:PORT
  const match = String(nodeId).match(/^port:(.+):(\d+)$/);
  if (match) return { ip: match[1], port: parseInt(match[2]) };
  return null;
}

function extractIp(nodeId) {
  const match = String(nodeId).match(/^ip:(.+)$/);
  if (match) return match[1];
  return null;
}

async function fetchShodanHost(ip) {
  try {
    const res = await fetch(`https://internetdb.shodan.io/${ip}`, {
      headers: { "User-Agent": "ThreadLine/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

async function fetchIpGeo(ip) {
  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,hosting`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

async function resolveDns(domain) {
  const out = { A: [], MX: [], NS: [], TXT: [] };
  try { out.A = await dns.resolve(domain, "A"); } catch {}
  try { out.MX = await dns.resolveMx(domain); } catch {}
  try { out.NS = await dns.resolve(domain, "NS"); } catch {}
  try { out.TXT = await dns.resolve(domain, "TXT"); } catch {}
  return out;
}

function domainFromNode(node = {}) {
  const id = String(node.id || "");
  if (id.startsWith("ssl:")) return normalizeDomain(id.slice(4));
  if (id.startsWith("domain:")) return normalizeDomain(id.slice(7));
  if (id.startsWith("subdomain:")) return normalizeDomain(id.slice(10));
  if (id.startsWith("ptr:")) return normalizeDomain(id.slice(4));
  if (id.startsWith("provider:")) return normalizeDomain(id.slice(9));
  if (node.type === "domain" || node.type === "subdomain") return normalizeDomain(node.label || "");
  return "";
}

export async function POST(request) {
  const payload = await request.json();
  const node = payload?.node || {};
  const mode = payload?.mode === "deep" ? "deep" : "standard";

  const nodeId = String(node.id || "");
  const nodeType = node.type || "unknown";
  const typeMeta = NODE_INTEL[nodeType] || {
    label: nodeType,
    color: "#94a3b8",
    description: () => `An intelligence node of type "${nodeType}" discovered during investigation.`,
  };

  const details = {
    node: {
      id: nodeId,
      label: node.label || nodeId,
      type: nodeType,
      typeLabel: typeMeta.label,
      color: typeMeta.color,
    },
    definition: typeMeta.description(nodeId),
    enrichment: {},
    raw: {},
  };

  // ── Port node ─────────────────────────────────────────────────────────
  const portMatch = extractPortAndIp(nodeId);
  if (portMatch || nodeType === "port" || nodeType === "pattern_flag") {
    const parsed = portMatch || extractPortAndIp(nodeId.replace("pattern_flag:", "port:"));
    if (parsed) {
      const portInfo = PORT_INTEL[parsed.port] || {
        service: "Unknown Service",
        risk: "unknown",
        note: `Port ${parsed.port} — no threat intelligence entry found in local database.`,
      };
      details.enrichment.port = {
        number: parsed.port,
        ip: parsed.ip,
        service: portInfo.service,
        riskLevel: portInfo.risk,
        analysis: portInfo.note,
      };
      // Fetch live Shodan data for the IP
      const [shodan, geo] = await Promise.all([
        fetchShodanHost(parsed.ip),
        fetchIpGeo(parsed.ip),
      ]);
      if (shodan) {
        details.enrichment.infrastructure = {
          allOpenPorts: shodan.ports || [],
          cpes: shodan.cpes || [],
          vulns: shodan.vulns || [],
          tags: shodan.tags || [],
          hostnames: shodan.hostnames || [],
        };
        details.raw.shodan = shodan;
      }
      if (geo && geo.status !== "fail") {
        details.enrichment.geolocation = {
          country: geo.country,
          region: geo.regionName,
          city: geo.city,
          isp: geo.isp,
          org: geo.org,
          asn: geo.as,
          isHosting: geo.hosting,
        };
      }
    }
  }

  // ── IP node ───────────────────────────────────────────────────────────
  const rawIp = extractIp(nodeId) || (nodeType === "ip" ? node.label : null);
  if (rawIp && !portMatch) {
    const [shodan, geo] = await Promise.all([
      fetchShodanHost(rawIp),
      fetchIpGeo(rawIp),
    ]);
    if (shodan) {
      details.enrichment.infrastructure = {
        openPorts: shodan.ports || [],
        cpes: shodan.cpes || [],
        vulns: shodan.vulns || [],
        tags: shodan.tags || [],
        hostnames: shodan.hostnames || [],
      };
      details.raw.shodan = shodan;
    }
    if (geo && geo.status !== "fail") {
      details.enrichment.geolocation = {
        country: geo.country,
        region: geo.regionName,
        city: geo.city,
        isp: geo.isp,
        org: geo.org,
        asn: geo.as,
        isHosting: geo.hosting,
      };
    }
  }

  // ── Domain / Subdomain node ───────────────────────────────────────────
  const domain = domainFromNode(node);
  if (domain) {
    const dnsData = await resolveDns(domain);
    details.enrichment.dns = {
      aRecords: dnsData.A,
      mailServers: dnsData.MX?.map(m => m.exchange),
      nameServers: dnsData.NS,
      txtRecords: dnsData.TXT?.flat().filter(t => t.includes("=") || t.startsWith("v=")),
    };
    details.raw.dns = dnsData;
    // Check for SPF/DMARC
    const allTxt = dnsData.TXT?.flat() || [];
    const spf = allTxt.find(t => t.startsWith("v=spf1"));
    const dmarc = allTxt.find(t => t.startsWith("v=DMARC1"));
    details.enrichment.emailSecurity = {
      spf: spf || null,
      dmarc: dmarc || null,
      hasSPF: !!spf,
      hasDMARC: !!dmarc,
    };
  }

  return NextResponse.json({ ok: true, details });
}
