import dns from "dns/promises";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  withRootEdge,
} from "./utils";

const RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"];
const RECORD_LABELS = {
  A: "IPv4 Server",
  AAAA: "IPv6 Server",
  MX: "Mail Server",
  NS: "Nameserver",
  TXT: "Text Record",
  CNAME: "Alias Route",
};

async function resolveViaDoh(domain, type) {
  const rrtype = String(type).toUpperCase();
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(rrtype)}`
  );
  if (!response.ok) return [];
  const json = await response.json();
  const answers = Array.isArray(json.Answer) ? json.Answer : [];

  if (rrtype === "MX") {
    return answers.map((row) => ({ exchange: String(row.data).replace(/^\d+\s+/, ""), priority: 0 }));
  }
  if (rrtype === "TXT") {
    return answers.map((row) => [String(row.data).replace(/^"|"$/g, "")]);
  }
  return answers.map((row) => row.data);
}

export async function run(input, inputType, options = {}) {
  const rootId = options.rootNodeId || `input:${input}`;
  const mode = options.mode || "standard";
  const result = baseResult("dns", mode);
  const log = attachDebugLogger(result, options);
  const domain =
    inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "DNS records are most relevant to domains and email domains.";
    result.timeline = makeTimeline("DNS Module", "Skipped: input type is not domain-based.");
    return result;
  }

  const records = {};
  let risk = 0;

  await Promise.all(
    RECORD_TYPES.map(async (type) => {
      try {
        log(`DNS lookup ${type} for ${domain}`, { source: "dns", type, domain });
        if (type === "MX") {
          records[type] = await dns.resolveMx(domain);
        } else if (type === "A" || type === "AAAA") {
          records[type] = await dns.resolve(domain, type);
          if (records[type].length === 0) {
            const fallback = await dns.lookup(domain, { all: true, family: type === "AAAA" ? 6 : 4 });
            records[type] = fallback.map((item) => item.address);
          }
        } else {
          records[type] = await dns.resolve(domain, type);
        }
        log(`DNS ${type} success (${records[type].length}) for ${domain}`, {
          source: "dns",
          type,
          count: records[type].length,
          domain,
        });
      } catch {
        records[type] = [];
        if (mode === "deep") {
          try {
            log(`DNS ${type} failed locally, retrying via DNS-over-HTTPS for ${domain}`, {
              source: "dns",
              type,
              domain,
              fallback: "dns.google",
            });
            records[type] = await resolveViaDoh(domain, type);
          } catch {
            records[type] = [];
          }
        }
        log(`DNS ${type} returned ${records[type].length} record(s) for ${domain}`, {
          source: "dns",
          type,
          domain,
          count: records[type].length,
        });
      }
    })
  );

  const nsCount = (records.NS || []).length;
  if (nsCount === 0) {
    risk += 7;
  }

  const txtRecords = (records.TXT || []).flat().join(" ");
  if (!txtRecords.includes("v=spf1")) {
    risk += 4;
  }

  for (const [type, values] of Object.entries(records)) {
    const countNodeId = `dns:${type}:${domain}`;
    const friendlyName = RECORD_LABELS[type] || type;
    result.nodes.push({
      id: countNodeId,
      label: `${friendlyName} (${(values || []).length})`,
      type: "dns_record",
    });
    result.edges.push(...withRootEdge(rootId, countNodeId, "has_record"));
  }

  result.data = { domain, records };
  result.summary = `Collected DNS records for ${domain}.`;
  result.riskContribution = risk;
  result.timeline = makeTimeline("DNS Module", `Resolved core DNS records for ${domain}.`);
  return result;
}
