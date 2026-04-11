import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  resolveIpFromTarget,
  timeoutSignal,
  withRootEdge,
} from "./utils";

const SUSPICIOUS_HOSTS = [
  "DigitalOcean",
  "Hostinger",
  "Choopa",
  "Vultr",
  "Linode",
  "Hetzner",
  "Contabo",
];

async function fetchJson(url, timeoutMs, log) {
  const { signal, cleanup } = timeoutSignal(timeoutMs);
  try {
    log(`Querying ASN endpoint: ${url}`, { source: "website", url });
    const response = await fetch(url, { signal });
    const text = await response.text();
    cleanup();
    if (!response.ok) {
      return { ok: false, status: response.status, error: text.slice(0, 200) };
    }
    return { ok: true, status: response.status, data: JSON.parse(text) };
  } catch (error) {
    cleanup();
    return { ok: false, status: 0, error: error.message };
  }
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("asnLookup", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const targetIp = await resolveIpFromTarget(input, inputType);
  if (!targetIp) {
    result.status = "partial";
    result.summary = "Could not resolve a target IP for ASN lookup.";
    result.timeline = makeTimeline("ASN Lookup", "Skipped: no resolvable IP.");
    return result;
  }

  const providers = [];
  if (process.env.IPINFO_TOKEN) {
    providers.push({
      name: "ipinfo",
      url: `https://ipinfo.io/${targetIp}/json?token=${process.env.IPINFO_TOKEN}`,
      map: (d) => ({
        status: d.error ? "fail" : "success",
        query: targetIp,
        isp: d.org,
        org: d.org,
        as: d.org,
      }),
    });
  }
  providers.push({
    name: "ip-api",
    url: `http://ip-api.com/json/${targetIp}?fields=status,query,isp,org,as`,
    map: (d) => d,
  });

  let data = null;
  let usedProvider = null;
  for (const provider of providers) {
    const payload = await fetchJson(provider.url, 8000, log);
    if (!payload.ok) continue;
    const mapped = provider.map(payload.data);
    if (mapped.status === "success") {
      data = mapped;
      usedProvider = provider.name;
      break;
    }
  }

  if (!data) {
    result.status = "error";
    result.summary = "ASN lookup failed across all providers.";
    return result;
  }

  const asText = `${data.as || ""} ${data.isp || ""} ${data.org || ""}`;
  const suspicious = SUSPICIOUS_HOSTS.some((host) => asText.includes(host));
  result.riskContribution = suspicious ? 18 : 0;
  result.data = { ...data, provider: usedProvider };
  result.summary = suspicious
    ? "IP hosted on infrastructure frequently abused for malicious campaigns."
    : "ASN ownership appears routine.";
  result.timeline = makeTimeline(
    "ASN Lookup",
    `Resolved ASN ownership for ${targetIp} via ${usedProvider}.`
  );

  const nodeId = `asn:${data.as || data.isp || "unknown"}`;
  result.nodes.push({
    id: nodeId,
    label: data.as || data.isp || "Unknown ASN",
    type: "dataset_match",
  });
  result.edges.push(...withRootEdge(rootId, nodeId, "hosted_on"));
  return result;
}
