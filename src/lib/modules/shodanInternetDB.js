import { loadCisaKev } from "../datasetSources";
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
    const shodanUrl = process.env.SHODAN_INTERNETDB_URL || "https://internetdb.shodan.io";
    const url = `${shodanUrl}/${targetIp}`;
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

    const cisaMap = await loadCisaKev(log);
    const exploitedVulns = [];
    vulns.forEach((cve) => {
      const match = cisaMap.get(String(cve).toUpperCase());
      if (match) {
        exploitedVulns.push({
          cveID: match.cveID,
          vendorProject: match.vendorProject,
          product: match.product,
          vulnerabilityName: match.vulnerabilityName,
          shortDescription: match.shortDescription,
          requiredAction: match.requiredAction,
        });
      }
    });

    result.data = {
      ...data,
      exploitedVulns,
    };

    log(`Shodan InternetDB returned ${ports.length} port(s), ${vulns.length} vuln(s), and matched ${exploitedVulns.length} CISA exploited vuln(s).`, {
      source: "website",
      url,
      ports: ports.length,
      vulns: vulns.length,
      exploitedCount: exploitedVulns.length,
    });

    result.summary = `Found ${ports.length} open port(s), ${vulns.length} vuln(s) (${exploitedVulns.length} known active exploits).`;
    result.riskContribution = Math.min(30, risky.length * 6 + vulns.length * 2 + exploitedVulns.length * 10);
    result.timeline = makeTimeline("Shodan InternetDB", `Fetched exposure metadata and matched ${exploitedVulns.length} wild-active exploit(s).`);

    ports.slice(0, 8).forEach((port) => {
      const nodeId = `port:${targetIp}:${port}`;
      result.nodes.push({
        id: nodeId,
        label: `Port ${port}`,
        type: "pattern_flag",
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "exposes"));
    });

    exploitedVulns.forEach((ev) => {
      const nodeId = `cisa:cve:${ev.cveID.toLowerCase()}`;
      result.nodes.push({
        id: nodeId,
        label: `Active Exploit: ${ev.cveID}`,
        type: "pattern_flag",
        category: "critical",
        meta: {
          product: `${ev.vendorProject} ${ev.product}`,
          description: ev.shortDescription,
        },
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "vulnerable_to"));
    });

    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `Shodan request failed: ${error.message}`;
    return result;
  }
}
