import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  timeoutSignal,
  withRootEdge,
} from "./utils";

function otxHeaders() {
  return {
    "user-agent": "ThreadLine/1.0",
    ...(process.env.OTX_API_KEY ? { "X-OTX-API-KEY": process.env.OTX_API_KEY } : {}),
  };
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("alienvaultOtx", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  const { signal, cleanup } = timeoutSignal(9000);
  const otxApiUrl = process.env.OTX_API_URL || "https://otx.alienvault.com/api/v1/indicators";

  try {
    if (inputType === "domain") {
      const domain = normalizeDomain(input);
      const url = `${otxApiUrl}/domain/${domain}/passive_dns`;
      log(`Querying AlienVault OTX Passive DNS API: ${url}`, { source: "website", url });

      const response = await fetch(url, { headers: otxHeaders(), signal });
      cleanup();

      if (!response.ok) {
        result.status = "partial";
        result.summary = `OTX API returned status ${response.status}. Passive DNS check skipped.`;
        return result;
      }

      const payload = await response.json();
      const records = payload.passive_dns || [];
      
      // Filter out invalid/empty addresses and group by IP address
      const uniqueIps = {};
      records.forEach((record) => {
        if (record.address && record.record_type === "A") {
          uniqueIps[record.address] = {
            address: record.address,
            asn: record.asn,
            first: record.first,
            last: record.last,
          };
        }
      });

      const ipList = Object.values(uniqueIps);
      result.data = {
        totalRecords: records.length,
        uniqueAAddressCount: ipList.length,
        resolutions: ipList.slice(0, 15),
      };

      log(`AlienVault OTX found ${records.length} passive DNS records (${ipList.length} unique IPs) for ${domain}.`, {
        source: "website",
        url,
        recordsCount: records.length,
      });

      if (ipList.length === 0) {
        result.status = "success";
        result.summary = "No passive DNS resolution history found in OTX databases.";
        result.timeline = makeTimeline("Passive DNS", "No historical resolutions discovered.");
        return result;
      }

      result.summary = `Discovered ${ipList.length} historical IP resolution(s) via AlienVault OTX.`;
      result.timeline = makeTimeline("Passive DNS", `Extracted ${ipList.length} unique historical IP resolutions.`);

      // Add IP nodes for historical resolutions
      ipList.slice(0, 8).forEach((res) => {
        const ipNodeId = `ip:${res.address}`;
        result.nodes.push({
          id: ipNodeId,
          label: `Hist. IP: ${res.address}`,
          type: "geolocation",
          category: "warning",
          meta: {
            asn: res.asn,
            first_seen: res.first,
            last_seen: res.last,
          },
        });
        result.edges.push({
          source: rootId,
          target: ipNodeId,
          rel: "resolved_to",
        });
      });

      return result;

    } else if (inputType === "ip") {
      const url = `${otxApiUrl}/IPv4/${input}/general`;
      log(`Querying AlienVault OTX IP Reputation API: ${url}`, { source: "website", url });

      const response = await fetch(url, { headers: otxHeaders(), signal });
      cleanup();

      if (!response.ok) {
        result.status = "partial";
        result.summary = `OTX API returned status ${response.status}. Reputation check skipped.`;
        return result;
      }

      const payload = await response.json();
      const pulseInfo = payload.pulse_info || {};
      const pulses = pulseInfo.pulses || [];

      const threatPulses = pulses.map((pulse) => ({
        id: pulse.id,
        name: pulse.name,
        description: pulse.description,
        tags: pulse.tags || [],
        adversary: pulse.adversary || "unknown",
      }));

      result.data = {
        pulseCount: pulseInfo.count || 0,
        reputation: payload.reputation || 0,
        pulses: threatPulses.slice(0, 10),
      };

      log(`AlienVault OTX returned reputation ${payload.reputation || 0} and ${pulses.length} pulses for IP ${input}.`, {
        source: "website",
        url,
        pulsesCount: pulses.length,
      });

      if (pulses.length === 0) {
        result.status = "success";
        result.summary = "No active threat pulses or reputation flags recorded for this IP address.";
        result.timeline = makeTimeline("Threat Intelligence", "Reputation check clean.");
        return result;
      }

      const riskVal = Math.min(25, pulses.length * 6);
      result.riskContribution = riskVal;
      result.summary = `IP flagged in ${pulses.length} threat intelligence pulse(s). Reputation: ${payload.reputation || 0}`;
      result.timeline = makeTimeline("Threat Intelligence", `IP linked to ${pulses.length} active security pulse(s).`);

      // Add Pulse Nodes
      threatPulses.slice(0, 4).forEach((pulse) => {
        const nodeId = `otx:pulse:${pulse.id}`;
        result.nodes.push({
          id: nodeId,
          label: `Threat Pulse: ${pulse.name.slice(0, 24)}...`,
          type: "pattern_flag",
          category: "critical",
          meta: {
            description: pulse.description,
            adversary: pulse.adversary,
            tags: pulse.tags.slice(0, 5),
          },
        });
        result.edges.push(...withRootEdge(rootId, nodeId, "flagged_in"));
      });

      return result;

    } else {
      cleanup();
      result.status = "partial";
      result.summary = "AlienVault OTX check is only relevant to domain or IP inputs.";
      result.timeline = makeTimeline("OTX Check", "Skipped: non-domain/IP input.");
      return result;
    }
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `AlienVault OTX query failed: ${error.message}`;
    return result;
  }
}
