import { whoisDomain } from "whoiser";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  withRootEdge,
} from "./utils";

function parseCreationDate(record) {
  const candidates = [
    record?.creationDate,
    record?.createdDate,
    record?.registered,
    record?.Creation_Date,
  ];
  const raw = candidates.find(Boolean);
  if (!raw) return null;
  const parsed = new Date(Array.isArray(raw) ? raw[0] : raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("whois", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "WHOIS lookup is only relevant for domain-based inputs.";
    result.timeline = makeTimeline("WHOIS", "Skipped: non-domain input.");
    return result;
  }

  try {
    log(`Querying WHOIS for domain: ${domain}`, { source: "website", domain });
    const raw = await whoisDomain(domain, {
      follow: 1,
      timeout: 8000,
      format: "json",
    });
    const primary = raw?.[0] || {};
    const creationDate = parseCreationDate(primary);
    const ageDays = creationDate
      ? Math.floor((Date.now() - creationDate.getTime()) / 86400000)
      : null;

    result.data = {
      domain,
      registrar: primary.registrar || primary.sponsoringRegistrar || null,
      creationDate: creationDate?.toISOString() || null,
      expiryDate: primary.expiryDate || primary.registryExpiryDate || null,
      nameServers: primary.nameServer || primary.nserver || [],
      ageDays,
    };
    result.summary = ageDays !== null ? `Domain age is ${ageDays} day(s).` : "WHOIS data found.";
    log(
      `WHOIS result parsed for ${domain}${ageDays !== null ? ` (age ${ageDays} day(s))` : ""}.`,
      { source: "website", domain, ageDays }
    );
    result.riskContribution = ageDays !== null && ageDays < 90 ? 20 : 0;
    result.timeline = makeTimeline("WHOIS", `Queried WHOIS data for ${domain}.`);

    const nodeId = `whois:${domain}`;
    result.nodes.push({
      id: nodeId,
      label: result.data.registrar || "Unknown registrar",
      type: "dataset_match",
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "registered_by"));
    return result;
  } catch (error) {
    result.status = "error";
    result.summary = `WHOIS lookup failed: ${error.message}`;
    return result;
  }
}
