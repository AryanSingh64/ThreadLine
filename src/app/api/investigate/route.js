import { buildCorrelation } from "@/lib/correlation";
import { generateExplanation } from "@/lib/explanation";
import { calculateThreatScore } from "@/lib/scoring";
import { detectInputType, getModules, normalizeInput } from "@/lib/orchestrator";
import { run as runAsnLookup } from "@/lib/modules/asnLookup";
import { run as runDatasetMatch } from "@/lib/modules/datasetMatch";
import { run as runDns } from "@/lib/modules/dns";
import { run as runEmailIntel } from "@/lib/modules/emailIntel";
import { run as runIpGeoApi } from "@/lib/modules/ipGeoApi";
import { run as runLocalIpLookup } from "@/lib/modules/localIpLookup";
import { run as runOpenPhish } from "@/lib/modules/openphish";
import { run as runPatternAnalysis } from "@/lib/modules/patternAnalysis";
import { run as runReverseDns } from "@/lib/modules/reverseDns";
import { run as runShodanInternetDB } from "@/lib/modules/shodanInternetDB";
import { run as runSslExtraction } from "@/lib/modules/sslExtraction";
import { run as runSubdomain } from "@/lib/modules/subdomain";
import { run as runTechFingerprint } from "@/lib/modules/techFingerprint";
import { run as runUsernameEnum } from "@/lib/modules/usernameEnum";
import { run as runWhois } from "@/lib/modules/whois";
import { run as runKeybaseLookup } from "@/lib/modules/keybaseLookup";
import { run as runGithubCommitSearch } from "@/lib/modules/githubCommitSearch";
import { run as runAlienvaultOtx } from "@/lib/modules/alienvaultOtx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODULE_RUNNERS = {
  asnLookup: runAsnLookup,
  datasetMatch: runDatasetMatch,
  dns: runDns,
  emailIntel: runEmailIntel,
  ipGeoApi: runIpGeoApi,
  localIpLookup: runLocalIpLookup,
  openphish: runOpenPhish,
  patternAnalysis: runPatternAnalysis,
  reverseDns: runReverseDns,
  shodanInternetDB: runShodanInternetDB,
  sslExtraction: runSslExtraction,
  subdomain: runSubdomain,
  techFingerprint: runTechFingerprint,
  usernameEnum: runUsernameEnum,
  whois: runWhois,
  keybaseLookup: runKeybaseLookup,
  githubCommitSearch: runGithubCommitSearch,
  alienvaultOtx: runAlienvaultOtx,
};

function createSseEvent(event, payload) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function dedupeNodes(nodes) {
  const map = new Map();
  for (const node of nodes) {
    if (node?.id) map.set(node.id, node);
  }
  return [...map.values()];
}

function dedupeEdges(edges) {
  const seen = new Set();
  const output = [];
  for (const edge of edges) {
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = normalizeInput(searchParams.get("q"));
  const mode = searchParams.get("mode") === "deep" ? "deep" : "standard";

  if (!q) {
    return new Response("Missing query", { status: 400 });
  }

  const inputType = detectInputType(q);
  const modules = getModules(inputType, mode);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const allResults = [];
      const graph = { nodes: [], edges: [] };
      const rootNodeId = `input:${q}`;

      const write = (event, payload) => {
        controller.enqueue(encoder.encode(createSseEvent(event, payload)));
      };

      write("status", {
        message: "Investigation started",
        input: q,
        inputType,
        mode,
        modules,
      });

      const tasks = modules.map(async (moduleName) => {
        const runner = MODULE_RUNNERS[moduleName];
        if (!runner) return null;

        write("status", {
          message: `Running ${moduleName}...`,
          module: moduleName,
        });

        try {
          const result = await runner(q, inputType, {
            mode,
            rootNodeId,
            log: (message, meta = {}) => {
              write("status", {
                message,
                module: moduleName,
                debug: true,
                meta,
              });
            },
          });
          if (!result) return null;

          allResults.push(result);
          graph.nodes.push(...(result.nodes || []));
          graph.edges.push(...(result.edges || []));

          const dedupedGraph = {
            nodes: dedupeNodes(graph.nodes),
            edges: dedupeEdges(graph.edges),
          };

          write("module_result", { module: moduleName, ...result });
          write("graph_update", dedupedGraph);
          return result;
        } catch (error) {
          const failed = {
            module: moduleName,
            status: "error",
            summary: error.message,
            data: null,
            nodes: [],
            edges: [],
            riskContribution: 0,
            debug: [
              {
                time: new Date().toISOString(),
                message: `Module error: ${error.message}`,
              },
            ],
            timeline: [
              {
                time: new Date().toISOString(),
                event: `${moduleName} failed`,
                detail: error.message,
              },
            ],
          };
          allResults.push(failed);
          write("module_result", failed);
          return failed;
        }
      });

      await Promise.allSettled(tasks);

      const correlated = buildCorrelation({
        input: q,
        inputType,
        moduleResults: allResults,
      });
      const score = calculateThreatScore({ mode, moduleResults: allResults });
      const explanation = generateExplanation({
        input: q,
        inputType,
        mode,
        score: score.score,
        label: score.label,
        moduleResults: allResults,
      });

      write("score", score);
      write("explanation", { text: explanation });
      write("complete", {
        summary: {
          query: q,
          inputType,
          mode,
          modulesExecuted: modules.length,
          modulesCompleted: allResults.length,
          graph: correlated,
          results: allResults,
          score,
          explanation,
          timeline: correlated.timeline,
        },
      });

      controller.close();
    },
    cancel() {
      // No-op cleanup for now
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
