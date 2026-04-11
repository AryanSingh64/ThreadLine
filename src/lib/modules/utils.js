export function makeTimeline(event, detail) {
  return [
    {
      time: new Date().toISOString(),
      event,
      detail,
    },
  ];
}

export function normalizeDomain(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text.includes("@")) return text.split("@")[1] || "";
  return text.replace(/^https?:\/\//, "").split("/")[0];
}

export function baseResult(moduleName, mode = "standard") {
  return {
    module: moduleName,
    mode,
    status: "success",
    summary: "",
    data: {},
    nodes: [],
    edges: [],
    riskContribution: 0,
    timeline: [],
    debug: [],
  };
}

export function attachDebugLogger(result, options = {}) {
  return (message, meta = {}) => {
    const entry = {
      time: new Date().toISOString(),
      message,
      ...meta,
    };
    result.debug.push(entry);
    options.log?.(message, meta);
  };
}

export function withRootEdge(rootId, nodeId, rel = "related_to") {
  if (!rootId || !nodeId) return [];
  return [{ source: rootId, target: nodeId, rel }];
}

export function timeoutSignal(ms = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

export async function resolveIpFromTarget(input, inputType) {
  const dns = await import("dns/promises");
  let host = String(input || "").trim().toLowerCase();

  if (inputType === "email") {
    host = host.split("@")[1] || "";
  }

  if (inputType === "domain" || inputType === "email") {
    host = host.replace(/^https?:\/\//, "").split("/")[0];
    if (!host) return null;

    try {
      const lookup = await dns.lookup(host, { all: true });
      const preferredV4 = lookup.find((item) => item.family === 4);
      return preferredV4?.address || lookup[0]?.address || null;
    } catch {
      return null;
    }
  }

  return inputType === "ip" ? host : null;
}
