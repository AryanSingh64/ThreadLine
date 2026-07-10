import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  timeoutSignal,
  withRootEdge,
} from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("openphish", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "OpenPhish checks are only relevant to domains.";
    result.timeline = makeTimeline("OpenPhish", "Skipped: non-domain input.");
    return result;
  }

  const { signal, cleanup } = timeoutSignal(9000);
  try {
    const url = process.env.OPENPHISH_FEED_URL || "https://openphish.com/feed.txt";
    log(`Fetching phishing feed: ${url}`, { source: "website", url });
    const response = await fetch(url, { signal });
    cleanup();

    if (!response.ok) {
      result.status = "error";
      result.summary = `OpenPhish returned status ${response.status}.`;
      return result;
    }

    const text = await response.text();
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const matches = lines.filter((url) => {
      try {
        return new URL(url).hostname.toLowerCase().includes(domain);
      } catch {
        return false;
      }
    });
    log(`OpenPhish scan completed: ${matches.length} domain match(es)`, {
      source: "website",
      url,
      matches: matches.length,
    });

    result.data = {
      domain,
      matches: matches.slice(0, 20),
      totalFeedLinesSampled: lines.length,
    };
    result.summary =
      matches.length > 0
        ? `Domain appears in the OpenPhish feed (${matches.length} hit(s)).`
        : "No direct OpenPhish feed hits.";
    result.riskContribution = matches.length > 0 ? 15 : 0;
    result.timeline = makeTimeline(
      "OpenPhish",
      matches.length > 0 ? "Matched active phishing feed entries." : "No feed match."
    );

    if (matches.length > 0) {
      const nodeId = `openphish:${domain}`;
      result.nodes.push({
        id: nodeId,
        label: `OpenPhish match (${matches.length})`,
        type: "dataset_match",
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "flagged_in"));
    }

    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `OpenPhish lookup failed: ${error.message}`;
    return result;
  }
}
