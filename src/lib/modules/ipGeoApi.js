import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  resolveIpFromTarget,
  timeoutSignal,
  withRootEdge,
} from "./utils";

async function fetchJson(url, timeoutMs, log) {
  const { signal, cleanup } = timeoutSignal(timeoutMs);
  try {
    log(`Querying geo endpoint: ${url}`, { source: "website", url });
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
  const result = baseResult("ipGeoApi", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const targetIp = await resolveIpFromTarget(input, inputType);
  if (!targetIp) {
    result.status = "partial";
    result.summary = "Could not resolve a target IP for geolocation.";
    result.timeline = makeTimeline("IP Geolocation", "Skipped: no resolvable IP.");
    return result;
  }

  const providers = [];
  if (process.env.IPINFO_TOKEN) {
    providers.push({
      name: "ipinfo",
      url: `https://ipinfo.io/${targetIp}/json?token=${process.env.IPINFO_TOKEN}`,
      map: (d) => ({
        status: d.error ? "fail" : "success",
        country: d.country,
        city: d.city,
        regionName: d.region,
        isp: d.org,
        org: d.org,
        lat: d.loc?.split(",")?.[0] || null,
        lon: d.loc?.split(",")?.[1] || null,
        timezone: d.timezone,
        query: targetIp,
      }),
    });
  }
  if (process.env.IPGEOLOCATION_API_KEY) {
    providers.push({
      name: "ipgeolocation",
      url: `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${targetIp}`,
      map: (d) => ({
        status: d.message ? "fail" : "success",
        country: d.country_name,
        city: d.city,
        regionName: d.state_prov,
        isp: d.isp,
        org: d.organization,
        lat: d.latitude,
        lon: d.longitude,
        timezone: d.time_zone?.name || d.timezone,
        query: targetIp,
      }),
    });
  }

  const ipApiUrl = process.env.IP_API_URL || "http://ip-api.com/json";
  providers.push({
    name: "ip-api",
    url: `${ipApiUrl}/${targetIp}?fields=status,country,city,regionName,isp,org,lat,lon,timezone,query`,
    map: (d) => d,
  });

  let data = null;
  let usedProvider = null;

  for (const provider of providers) {
    const payload = await fetchJson(provider.url, 9000, log);
    if (!payload.ok) {
      log(`Geo provider failed: ${provider.name} (${payload.status})`, {
        source: "website",
        url: provider.url,
        status: payload.status,
      });
      continue;
    }

    const mapped = provider.map(payload.data);
    if (mapped.status === "success") {
      data = mapped;
      usedProvider = provider.name;
      break;
    }
  }

  if (!data) {
    result.status = "error";
    result.summary = "No geolocation provider returned usable data.";
    return result;
  }

  result.data = {
    ...data,
    provider: usedProvider,
  };
  result.summary = `Resolved live geolocation for ${targetIp} via ${usedProvider}.`;
  result.timeline = makeTimeline(
    "IP Geolocation",
    `Resolved ${data.city || "unknown city"}, ${data.country || "unknown country"} via ${usedProvider}.`
  );

  const nodeId = `geoapi:${data.country}:${data.city}`;
  result.nodes.push({
    id: nodeId,
    label: `${data.city || "Unknown"}, ${data.country || "Unknown"}`,
    type: "geolocation",
  });
  result.edges.push(...withRootEdge(rootId, nodeId, "located_in"));
  return result;
}
