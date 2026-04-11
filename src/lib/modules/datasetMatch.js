import {
  extractDomainRoot,
  findPhishTankMatches,
  loadBettingWatchlist,
  loadBreachEntities,
  loadSecurityIndex,
  loadTopDomainsSet,
} from "../datasetSources";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  withRootEdge,
} from "./utils";

function includesLoose(text, sample) {
  return String(text || "").toLowerCase().includes(String(sample || "").toLowerCase());
}

function normalizeToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function domainMatchesDomainList(domain, domains = []) {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;
  return domains.some((d) => normalized === d || normalized.endsWith(`.${d}`) || d.endsWith(`.${normalized}`));
}

function tokenLooksUseful(token) {
  if (!token) return false;
  if (token.length < 5) return false;
  const blocked = new Set([
    "sports",
    "betting",
    "casino",
    "poker",
    "online",
    "live",
    "lucky",
    "winner",
    "slots",
    "games",
    "tips",
    "app",
    "real",
    "money",
  ]);
  return !blocked.has(token);
}

function findBettingWatchMatches({ input, inputType, domain, watchlist }) {
  const normalizedInputText = normalizeText(input);
  const domainRootToken = normalizeToken(extractDomainRoot(domain));
  const normalizedDomain = normalizeDomain(domain);

  const out = [];
  for (const entry of watchlist) {
    const aliasTokens = [...new Set([entry.brand, ...(entry.aliases || [])].map(normalizeToken))].filter(
      tokenLooksUseful
    );

    let hitType = "";
    let matchedOn = "";

    if (normalizedDomain && domainMatchesDomainList(normalizedDomain, entry.domains || [])) {
      hitType = "domain_exact_or_suffix";
      matchedOn = normalizedDomain;
    } else if (
      normalizedDomain &&
      aliasTokens.some((token) => normalizedDomain.includes(token) || domainRootToken.includes(token))
    ) {
      const token = aliasTokens.find(
        (t) => normalizedDomain.includes(t) || domainRootToken.includes(t)
      );
      hitType = "domain_brand_token";
      matchedOn = token || normalizedDomain;
    } else if (
      inputType !== "domain" &&
      aliasTokens.some((token) => normalizedInputText.includes(token))
    ) {
      const token = aliasTokens.find((t) => normalizedInputText.includes(t));
      hitType = "query_brand_token";
      matchedOn = token || normalizedInputText;
    }

    if (!hitType) continue;

    out.push({
      brand: entry.brand,
      hitType,
      matchedOn,
      severity: entry.severity || "critical",
      category: entry.category || "betting",
      region: entry.region || [],
      knownDomains: (entry.domains || []).slice(0, 8),
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const row of out) {
    const key = row.brand.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped.slice(0, 30);
}

function extractEntityHints(input, inputType) {
  if (inputType === "email") {
    const domain = normalizeDomain(input);
    const root = extractDomainRoot(domain);
    const local = String(input).split("@")[0] || "";
    return [root, local].filter(Boolean);
  }
  if (inputType === "domain") {
    return [extractDomainRoot(input)].filter(Boolean);
  }
  return [String(input || "").toLowerCase()];
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("datasetMatch", options.mode || "standard");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain =
    inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";
  const findings = [];

  const topDomains = await loadTopDomainsSet(log);
  const securityIndex = await loadSecurityIndex(log);
  const breachEntities = await loadBreachEntities(log);
  const bettingWatchlist = await loadBettingWatchlist(log);

  if (domain) {
    const inTop1M = topDomains.has(domain);
    log(`Checked top-1m-domains.csv -> ${inTop1M ? "hit" : "miss"} for ${domain}`, {
      source: "dataset",
      dataset: "top-1m-domains.csv",
      domain,
      hits: inTop1M ? 1 : 0,
    });
    findings.push({
      source: "top_1m_presence",
      records: [{ domain, present: inTop1M }],
    });
  }

  if (domain) {
    const securityRows = securityIndex.get(domain) || [];
    log(`Checked security.csv -> ${securityRows.length} hit(s) for ${domain}`, {
      source: "dataset",
      dataset: "security.csv",
      domain,
      hits: securityRows.length,
    });
    if (securityRows.length > 0) {
      findings.push({ source: "security_csv", records: securityRows.slice(0, 20) });
    }

    const phishTankMatches = await findPhishTankMatches(domain, log, 25);
    if (phishTankMatches.length > 0) {
      findings.push({ source: "phishtank_csv", records: phishTankMatches });
    }
  }

  const entityHints = extractEntityHints(input, inputType);
  const breachMatches = breachEntities
    .filter((entry) => entityHints.some((hint) => includesLoose(entry.normalized, hint)))
    .slice(0, 30);
  log(`Checked breach-leak simulation dataset.csv -> ${breachMatches.length} hint match(es)`, {
    source: "dataset",
    dataset: "breach-leak simulation dataset.csv",
    hits: breachMatches.length,
  });
  if (breachMatches.length > 0) {
    findings.push({ source: "breach_entity_context", records: breachMatches });
  }

  const bettingMatches = findBettingWatchMatches({
    input,
    inputType,
    domain,
    watchlist: bettingWatchlist,
  });
  log(`Checked illegal-betting-watchlist.json -> ${bettingMatches.length} hit(s)`, {
    source: "dataset",
    dataset: "illegal-betting-watchlist.json",
    hits: bettingMatches.length,
    inputType,
    input,
  });
  if (bettingMatches.length > 0) {
    findings.push({ source: "betting_watchlist", records: bettingMatches });
  }

  let risk = 0;
  for (const item of findings) {
    if (item.source === "security_csv") {
      const malicious = item.records.filter((r) =>
        String(r.label || "").includes("maligna")
      ).length;
      risk += malicious > 0 ? 18 : 4;
    }
    if (item.source === "phishtank_csv") {
      risk += 20;
    }
    if (item.source === "top_1m_presence") {
      const present = item.records[0]?.present;
      if (!present) risk += 8;
    }
    if (item.source === "breach_entity_context") {
      risk += 6;
    }
    if (item.source === "betting_watchlist") {
      risk += Math.min(42, 28 + item.records.length * 5);
    }
  }

  result.data = { findings };
  result.summary =
    findings.length > 0
      ? `Matched ${findings.length} dataset signal group(s) from Datasets/.`
      : "No dataset matches found from Datasets/.";
  result.riskContribution = Math.min(45, risk);
  result.timeline = makeTimeline(
    "Dataset Match",
    findings.length > 0 ? "Found large-dataset intelligence matches." : "No dataset hits."
  );

  findings.forEach((finding) => {
    const nodeId = `dataset:${finding.source}`;
    result.nodes.push({
      id: nodeId,
      label: finding.source,
      type: "dataset_match",
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "matched_in"));

    if (finding.source === "betting_watchlist") {
      finding.records.slice(0, 12).forEach((record) => {
        const token = normalizeToken(record.brand).slice(0, 36);
        const criticalId = `critical:betting:${token}`;
        result.nodes.push({
          id: criticalId,
          label: `Critical: ${record.brand}`,
          type: "critical",
          meta: {
            hitType: record.hitType,
            matchedOn: record.matchedOn,
            domains: record.knownDomains,
            region: record.region,
          },
        });
        result.edges.push({ source: nodeId, target: criticalId, rel: "critical_match" });
      });
    }
  });

  return result;
}
