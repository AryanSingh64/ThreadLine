import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  timeoutSignal,
  withRootEdge,
} from "./utils";

const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
];

export async function run(input, inputType, options = {}) {
  const result = baseResult("techFingerprint", options.mode || "standard");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "Tech fingerprinting is only applicable to domains.";
    result.timeline = makeTimeline(
      "Tech Fingerprint",
      "Skipped: input type is not a domain or email."
    );
    return result;
  }

  let response = null;
  let urlUsed = `https://${domain}`;
  const candidates = [
    `https://${domain}`,
    `https://www.${domain}`,
    `http://${domain}`,
    `http://www.${domain}`,
  ];

  if (domain === "gmail.com") {
    candidates.unshift("https://mail.google.com");
    candidates.unshift("https://accounts.google.com");
  }

  for (const candidate of [...new Set(candidates)]) {
    const { signal, cleanup } = timeoutSignal(6500);
    try {
      log(`Requesting website header fingerprint: ${candidate}`, {
        source: "website",
        url: candidate,
      });
      const res = await fetch(candidate, {
        method: "GET",
        redirect: "follow",
        signal,
        headers: { "user-agent": "ThreadLine/1.0 Intelligence Scanner" },
      });
      response = res;
      urlUsed = candidate;
      log(`Website responded: ${candidate} [${res.status}]`, {
        source: "website",
        url: candidate,
        status: res.status,
      });
      cleanup();
      break;
    } catch {
      log(`Website request failed: ${candidate}`, {
        source: "website",
        url: candidate,
      });
      cleanup();
    }
  }

  if (!response) {
    result.status = "error";
    result.summary = `Unable to reach ${domain} for fingerprinting.`;
    result.riskContribution = 12;
    result.timeline = makeTimeline("Tech Fingerprint", `Connection failed to ${domain}.`);
    return result;
  }

  const headers = {
    server: response.headers.get("server"),
    poweredBy: response.headers.get("x-powered-by"),
    generator: response.headers.get("x-generator"),
    via: response.headers.get("via"),
  };

  const missingSecurityHeaders = SECURITY_HEADERS.filter(
    (header) => !response.headers.get(header)
  );

  result.data = {
    domain,
    urlUsed,
    status: response.status,
    headers,
    missingSecurityHeaders,
  };
  result.summary = `Identified stack and header posture for ${domain}.`;
  result.riskContribution = missingSecurityHeaders.length * 2;
  result.timeline = makeTimeline(
    "Tech Fingerprint",
    `Read response headers from ${urlUsed}.`
  );

  if (headers.server) {
    const nodeId = `tech:server:${domain}`;
    result.nodes.push({ id: nodeId, label: `Server: ${headers.server}`, type: "tech" });
    result.edges.push(...withRootEdge(rootId, nodeId, "powered_by"));
  }

  if (missingSecurityHeaders.length > 0) {
    const nodeId = `tech:missing_headers:${domain}`;
    result.nodes.push({
      id: nodeId,
      label: `Missing ${missingSecurityHeaders.length} security headers`,
      type: "pattern_flag",
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "flagged_by"));
  }

  return result;
}
