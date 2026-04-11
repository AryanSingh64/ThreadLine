import dns from "dns/promises";
import { whoisDomain } from "whoiser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0];
}

function timeoutSignal(ms = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

function pickMeta(html, regex) {
  const match = html.match(regex);
  return match?.[1]?.trim() || null;
}

async function scrapePublicPage(url) {
  const { signal, cleanup } = timeoutSignal(10000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal,
      headers: {
        "user-agent": "ThreadLine/1.0 Node Enrichment",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await response.text();
    cleanup();

    const title = pickMeta(html, /<title[^>]*>([^<]*)<\/title>/i);
    const description =
      pickMeta(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
      ) ||
      pickMeta(
        html,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i
      );
    const h1 = pickMeta(html, /<h1[^>]*>([^<]*)<\/h1>/i);

    return {
      ok: true,
      status: response.status,
      finalUrl: response.url,
      headers: {
        server: response.headers.get("server"),
        poweredBy: response.headers.get("x-powered-by"),
        contentType: response.headers.get("content-type"),
      },
      extracted: {
        title,
        description,
        h1,
      },
      bodyLength: html.length,
    };
  } catch (error) {
    cleanup();
    return { ok: false, error: error.message };
  }
}

async function resolveDns(domain) {
  const out = { A: [], AAAA: [], MX: [], NS: [], TXT: [] };
  try {
    out.A = await dns.resolve(domain, "A");
  } catch {}
  try {
    out.AAAA = await dns.resolve(domain, "AAAA");
  } catch {}
  try {
    out.MX = await dns.resolveMx(domain);
  } catch {}
  try {
    out.NS = await dns.resolve(domain, "NS");
  } catch {}
  try {
    out.TXT = await dns.resolve(domain, "TXT");
  } catch {}
  return out;
}

async function lookupWhois(domain) {
  try {
    const rows = await whoisDomain(domain, { timeout: 8000, follow: 1, format: "json" });
    const first = rows?.[0] || {};
    return {
      registrar: first.registrar || first.sponsoringRegistrar || null,
      creationDate:
        first.creationDate || first.createdDate || first.Creation_Date || null,
      expiryDate: first.expiryDate || first.registryExpiryDate || null,
      nameServer: first.nameServer || first.nserver || [],
    };
  } catch (error) {
    return { error: error.message };
  }
}

function domainFromNode(node = {}) {
  const id = String(node.id || "");
  const label = String(node.label || "");
  if (id.startsWith("ssl:")) return normalizeDomain(id.slice(4));
  if (id.startsWith("domain:")) return normalizeDomain(id.slice(7));
  if (id.startsWith("subdomain:")) return normalizeDomain(id.slice(10));
  if (id.startsWith("ptr:")) return normalizeDomain(id.slice(4));
  if (id.startsWith("provider:")) return normalizeDomain(id.slice(9));
  if (node.type === "domain" || node.type === "subdomain") return normalizeDomain(label);
  if (node.type === "platform" && node.meta?.url) {
    try {
      return normalizeDomain(new URL(node.meta.url).hostname);
    } catch {
      return "";
    }
  }
  return "";
}

export async function POST(request) {
  const payload = await request.json();
  const node = payload?.node || {};
  const mode = payload?.mode === "deep" ? "deep" : "standard";

  const domain = domainFromNode(node);
  const websiteUrl = node?.meta?.url || (domain ? `https://${domain}` : null);

  const details = {
    node: {
      id: node.id || null,
      label: node.label || null,
      type: node.type || null,
    },
    mode,
    domain: domain || null,
    website: null,
    dns: null,
    whois: null,
  };

  if (websiteUrl) {
    details.website = await scrapePublicPage(websiteUrl);
  }
  if (domain) {
    details.dns = await resolveDns(domain);
    if (mode === "deep") {
      details.whois = await lookupWhois(domain);
    }
  }

  return Response.json({
    ok: true,
    details,
  });
}

