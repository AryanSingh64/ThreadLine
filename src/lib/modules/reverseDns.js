import dns from "dns/promises";
import { attachDebugLogger, baseResult, makeTimeline, withRootEdge } from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("reverseDns", options.mode || "standard");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  if (inputType !== "ip") {
    result.status = "partial";
    result.summary = "Reverse DNS applies to IP inputs.";
    result.timeline = makeTimeline("Reverse DNS", "Skipped: non-IP input.");
    return result;
  }

  try {
    log(`Performing PTR lookup for ${input}`, { source: "dns", ip: input });
    const hostnames = await dns.reverse(input);
    log(`PTR lookup complete for ${input} (${hostnames.length} hostname(s))`, {
      source: "dns",
      ip: input,
      count: hostnames.length,
    });
    result.data = { ip: input, hostnames };
    result.summary =
      hostnames.length > 0
        ? `Found ${hostnames.length} PTR hostname(s).`
        : "No PTR hostnames discovered.";
    result.riskContribution = hostnames.length > 0 ? 0 : 12;
    result.timeline = makeTimeline(
      "Reverse DNS",
      hostnames.length > 0 ? "PTR records resolved." : "No PTR records found."
    );

    hostnames.forEach((host) => {
      const nodeId = `ptr:${host}`;
      result.nodes.push({ id: nodeId, label: host, type: "domain" });
      result.edges.push(...withRootEdge(rootId, nodeId, "points_to"));
    });
    return result;
  } catch (error) {
    log(`PTR lookup failed for ${input} (${error.code || "lookup_error"})`, {
      source: "dns",
      ip: input,
    });
    result.status = "partial";
    result.summary = `No PTR records found (${error.code || "lookup_error"}).`;
    result.riskContribution = 10;
    result.timeline = makeTimeline("Reverse DNS", "Lookup returned no PTR records.");
    return result;
  }
}
