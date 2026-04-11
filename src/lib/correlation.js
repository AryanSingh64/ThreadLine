function dedupeById(items) {
  const map = new Map();
  for (const item of items || []) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function dedupeEdges(edges) {
  const seen = new Set();
  const output = [];
  for (const edge of edges || []) {
    if (!edge?.source || !edge?.target) continue;
    const rel = edge.rel || "related_to";
    const key = `${edge.source}|${edge.target}|${rel}`;
    if (!seen.has(key)) {
      seen.add(key);
      output.push({ source: edge.source, target: edge.target, rel });
    }
  }
  return output;
}

export function buildCorrelation({ input, inputType, moduleResults }) {
  const rootId = `input:${input}`;
  const allNodes = [
    {
      id: rootId,
      label: input,
      type: inputType,
    },
  ];
  const allEdges = [];
  const timeline = [];

  for (const result of moduleResults) {
    if (!result) continue;
    allNodes.push(...(result.nodes || []));
    allEdges.push(...(result.edges || []));
    timeline.push(...(result.timeline || []));
  }

  if (inputType === "email") {
    const domain = input.split("@")[1];
    if (domain) {
      const domainId = `domain:${domain}`;
      allNodes.push({ id: domainId, label: domain, type: "domain" });
      allEdges.push({ source: rootId, target: domainId, rel: "registered_on" });
    }
  }

  timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

  return {
    nodes: dedupeById(allNodes),
    edges: dedupeEdges(allEdges),
    timeline,
  };
}

