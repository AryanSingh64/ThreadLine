import dns from "dns/promises";
import { lookupDbipCountry } from "../datasetSources";
import { attachDebugLogger, baseResult, makeTimeline, withRootEdge } from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("localIpLookup", options.mode || "standard");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  if (inputType !== "ip") {
    result.status = "partial";
    result.summary = "Local IP lookup runs only for IP inputs.";
    result.timeline = makeTimeline("Local IP Lookup", "Skipped: non-IP input.");
    return result;
  }

  log("Scanning country ranges from Datasets/dbip-country-lite-2026-04.csv", {
    source: "dataset",
    dataset: "dbip-country-lite-2026-04.csv",
    ip: input,
  });
  const match = await lookupDbipCountry(input, log);

  let reverse = [];
  try {
    log(`Running reverse DNS lookup for ${input}`, { source: "dns", ip: input });
    reverse = await dns.reverse(input);
    log(`Reverse DNS returned ${reverse.length} hostname(s) for ${input}`, {
      source: "dns",
      ip: input,
      count: reverse.length,
    });
  } catch {
    reverse = [];
    log(`Reverse DNS returned no hostnames for ${input}`, {
      source: "dns",
      ip: input,
      count: 0,
    });
  }

  let risk = 0;
  if (match?.countryCode && ["RU", "KP", "IR", "CN"].includes(match.countryCode)) risk += 8;
  if (reverse.length === 0) risk += 5;

  result.data = {
    ip: input,
    localGeo: match
      ? {
          countryCode: match.countryCode,
          startIp: match.startIp,
          endIp: match.endIp,
        }
      : null,
    reverseDns: reverse,
  };
  result.summary = match
    ? `Matched ${input} to offline country range (${match.countryCode}).`
    : "No offline IP range match found.";
  result.riskContribution = risk;
  result.timeline = makeTimeline(
    "Local IP Lookup",
    match ? `Mapped IP to country code ${match.countryCode}.` : "No local range mapping found."
  );

  if (match) {
    const nodeId = `geo:${match.countryCode}`;
    result.nodes.push({
      id: nodeId,
      label: `Country ${match.countryCode}`,
      type: "geolocation",
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "located_in"));
  }

  return result;
}

