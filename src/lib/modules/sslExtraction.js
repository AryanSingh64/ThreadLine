import tls from "tls";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  normalizeDomain,
  withRootEdge,
} from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("sslExtraction", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;
  const domain = inputType === "domain" || inputType === "email" ? normalizeDomain(input) : "";

  if (!domain) {
    result.status = "partial";
    result.summary = "SSL extraction is only applicable for domain-based inputs.";
    result.timeline = makeTimeline("SSL Extraction", "Skipped: non-domain input.");
    return result;
  }

  return new Promise((resolve) => {
    log(`Opening TLS socket to ${domain}:443`, {
      source: "website",
      host: domain,
      port: 443,
    });
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const cert = socket.getPeerCertificate();
      if (!cert || Object.keys(cert).length === 0) {
        result.status = "error";
        result.summary = "TLS certificate unavailable.";
        result.riskContribution = 12;
        socket.destroy();
        resolve(result);
        return;
      }

      const issuer =
        cert.issuer?.O || cert.issuer?.CN || cert.issuerCertificate?.CN || "Unknown";
      const validFrom = new Date(cert.valid_from);
      const ageInDays = Math.floor((Date.now() - validFrom.getTime()) / 86400000);
      const isLetsEncrypt = issuer.includes("Let's Encrypt");
      const critical = isLetsEncrypt && ageInDays < 3;
      const warning = ageInDays < 14;

      result.data = {
        domain,
        subject: cert.subject?.CN || domain,
        issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        ageInDays,
      };
      result.riskContribution = critical ? 20 : warning ? 8 : 0;
      result.summary = critical
        ? "Very recent Let's Encrypt certificate detected."
        : warning
          ? "Certificate is newly issued."
          : "Certificate age appears normal.";
      log(`TLS certificate extracted from ${domain} (issuer: ${issuer})`, {
        source: "website",
        host: domain,
        issuer,
        ageInDays,
      });
      result.timeline = makeTimeline("SSL Extraction", `Extracted TLS certificate for ${domain}.`);

      const nodeId = `ssl:${domain}`;
      result.nodes.push({
        id: nodeId,
        label: `${issuer} (${ageInDays}d)`,
        type: "dataset_match",
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "secured_by"));
      socket.destroy();
      resolve(result);
    });

    socket.on("error", (error) => {
      log(`TLS socket error for ${domain}: ${error.message}`, {
        source: "website",
        host: domain,
      });
      result.status = "error";
      result.summary = `TLS connection failed: ${error.message}`;
      result.riskContribution = 8;
      resolve(result);
    });

    socket.setTimeout(5000, () => {
      log(`TLS socket timeout for ${domain}`, {
        source: "website",
        host: domain,
      });
      result.status = "error";
      result.summary = "TLS connection timed out.";
      result.riskContribution = 6;
      socket.destroy();
      resolve(result);
    });
  });
}
