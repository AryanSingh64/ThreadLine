import { loadTopDomainsSet } from "../datasetSources";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  withRootEdge,
} from "./utils";

function digitRatio(text) {
  if (!text) return 0;
  const digits = (text.match(/\d/g) || []).length;
  return digits / text.length;
}

function hasLeetspeak(text) {
  return /[013457]/.test(text) && /[a-z]/i.test(text);
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("patternAnalysis", options.mode || "standard");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const text = String(input || "").toLowerCase();
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";
  const flags = [];
  const topDomainsSet = await loadTopDomainsSet(log);
  const keywords = [
    "verify",
    "secure",
    "update",
    "billing",
    "payment",
    "wallet",
    "support",
    "signin",
    "account",
    "reset",
    "suspend",
  ];
  const suspiciousTlds = [".xyz", ".top", ".click", ".work", ".gq", ".tk", ".buzz", ".zip"];
  const regexRules = [
    "(?:pay|secure|login)[-_.]?(?:verify|update|check)",
    "[a-z]{3,}[0-9]{4,}",
    "(?:xn--)[a-z0-9-]+",
    "[a-z0-9-]{24,}",
    "(?:apple|microsoft|google|paypal|bank)[-_.]?(?:secure|support|help)",
  ];

  for (const keyword of keywords) {
    if (text.includes(String(keyword).toLowerCase())) {
      flags.push(`Suspicious keyword: ${keyword}`);
    }
  }

  for (const tld of suspiciousTlds) {
    if (domain.endsWith(tld)) {
      flags.push(`High-risk TLD: ${tld}`);
    }
  }

  for (const pattern of regexRules) {
    try {
      const rx = new RegExp(pattern, "i");
      if (rx.test(text)) {
        flags.push(`Pattern matched: ${pattern}`);
      }
    } catch {
      // ignore malformed local rule
    }
  }

  if (inputType === "domain" && domain.includes("--")) {
    flags.push("Multiple hyphens in domain");
  }
  if (digitRatio(text) > 0.3) {
    flags.push("High digit density");
  }
  if (hasLeetspeak(text)) {
    flags.push("Leetspeak style obfuscation");
  }
  if (domain.startsWith("xn--")) {
    flags.push("Punycode / homograph signal");
  }
  if (domain && !topDomainsSet.has(domain)) {
    flags.push("Domain not present in top-1m domains dataset");
  }

  result.data = { input, inputType, flags };
  log(`Pattern analysis completed with ${flags.length} flag(s).`, {
    source: "analysis",
    flags: flags.length,
  });
  result.summary =
    flags.length > 0
      ? `Detected ${flags.length} suspicious naming pattern(s).`
      : "No significant suspicious naming patterns found.";
  result.riskContribution = Math.min(flags.length * 5, 25);
  result.timeline = makeTimeline(
    "Pattern Analysis",
    flags.length > 0 ? `Flagged ${flags.length} anomaly signal(s).` : "No anomalies detected."
  );

  flags.forEach((flag, index) => {
    const nodeId = `pattern:${index}:${text.slice(0, 24)}`;
    result.nodes.push({ id: nodeId, label: flag, type: "pattern_flag" });
    result.edges.push(...withRootEdge(rootId, nodeId, "flagged_by"));
  });

  return result;
}
