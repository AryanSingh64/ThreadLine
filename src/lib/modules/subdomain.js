import dns from "dns/promises";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  timeoutSignal,
  withRootEdge,
} from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("subdomain", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "Subdomain discovery is only for domain-based inputs.";
    result.timeline = makeTimeline("Subdomain Discovery", "Skipped: non-domain input.");
    return result;
  }

  const { signal, cleanup } = timeoutSignal(9000);
  try {
    const url = `https://crt.sh/?q=%25.${domain}&output=json`;
    log(`Querying certificate transparency endpoint: ${url}`, {
      source: "website",
      url,
    });
    const response = await fetch(url, { signal });
    cleanup();
    if (!response.ok) {
      result.status = "error";
      result.summary = `crt.sh returned status ${response.status}.`;
      return result;
    }

    const rows = await response.json();
    const discovered = [...new Set(
      rows
        .flatMap((item) => String(item.name_value || "").split("\n"))
        .map((host) => host.trim().toLowerCase())
        .filter((host) => host && !host.startsWith("*.") && host.endsWith(domain))
    )].slice(0, 80);

    const activeChecks = await Promise.all(
      discovered.slice(0, 25).map(async (subdomain) => {
        try {
          await dns.resolve(subdomain);
          return { subdomain, active: true };
        } catch {
          return { subdomain, active: false };
        }
      })
    );

    result.data = { domain, discovered, advanced: activeChecks };
    log(`Subdomain discovery completed with ${discovered.length} unique hit(s).`, {
      source: "website",
      url,
      discovered: discovered.length,
    });
    result.summary = `Discovered ${discovered.length} certificate-linked subdomain(s).`;
    result.riskContribution = activeChecks.filter((x) => x.active).length > 10 ? 7 : 0;
    result.timeline = makeTimeline(
      "Subdomain Discovery",
      `Recovered ${discovered.length} subdomain(s) and found ${activeChecks.filter(x=>x.active).length} active.`
    );

    activeChecks.forEach(({ subdomain, active }) => {
      const nodeId = `subdomain:${subdomain}`;
      result.nodes.push({
        id: nodeId,
        label: subdomain,
        type: "subdomain",
        category: active ? "critical" : undefined,
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "parent_of"));
    });
    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `Subdomain query failed: ${error.message}`;
    return result;
  }
}
