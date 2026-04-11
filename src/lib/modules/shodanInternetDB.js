import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  resolveIpFromTarget,
  timeoutSignal,
  withRootEdge,
} from "./utils";

const RISKY_PORTS = [21, 23, 135, 137, 139, 445, 3389];

export async function run(input, inputType, options = {}) {
  const result = baseResult("shodanInternetDB", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const targetIp = await resolveIpFromTarget(input, inputType);
  if (!targetIp) {
    result.status = "partial";
    result.summary = "Could not resolve a target IP for Shodan InternetDB.";
    result.timeline = makeTimeline("Shodan InternetDB", "Skipped: no resolvable IP.");
    return result;
  }

  const { signal, cleanup } = timeoutSignal(8000);
  try {
    const url = `https://internetdb.shodan.io/${targetIp}`;
    log(`Querying Shodan InternetDB endpoint: ${url}`, {
      source: "website",
      url,
    });
    const response = await fetch(url, { signal });
    cleanup();

    if (response.status === 404) {
      result.status = "partial";
      result.summary = "No Shodan intelligence available for this IP.";
      result.timeline = makeTimeline("Shodan InternetDB", "No data found.");
      return result;
    }

    if (!response.ok) {
      result.status = "error";
      result.summary = `Shodan InternetDB returned status ${response.status}.`;
      return result;
    }

    const data = await response.json();
    const ports = data.ports || [];
    const risky = ports.filter((port) => RISKY_PORTS.includes(port));
    const vulns = data.vulns || [];

    result.data = data;
    log(`Shodan InternetDB returned ${ports.length} port(s) and ${vulns.length} vuln(s).`, {
      source: "website",
      url,
      ports: ports.length,
      vulns: vulns.length,
    });
    result.summary = `Found ${ports.length} open port(s) and ${vulns.length} vulnerability record(s).`;
    result.riskContribution = Math.min(30, risky.length * 6 + vulns.length * 2);
    result.timeline = makeTimeline("Shodan InternetDB", "Fetched exposure metadata from InternetDB.");

    ports.slice(0, 8).forEach((port) => {
      const nodeId = `port:${targetIp}:${port}`;
      result.nodes.push({
        id: nodeId,
        label: `Port ${port}`,
        type: "pattern_flag",
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "exposes"));
    });

    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `Shodan request failed: ${error.message}`;
    return result;
  }
}
