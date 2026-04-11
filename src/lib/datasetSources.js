import fs from "fs";
import path from "path";
import readline from "readline";
import { readFile } from "fs/promises";

const DATASETS_ROOT = path.join(process.cwd(), "Datasets");

const cache = {
  disposableDomains: null,
  sherlockPlatforms: null,
  topDomainsSet: null,
  securityIndex: null,
  breachEntities: null,
  bettingWatchlist: null,
};

function datasetPath(filename) {
  return path.join(DATASETS_ROOT, filename);
}

function normalizeDomain(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0];
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function toIpInt(ip) {
  const parts = String(ip || "").split(".");
  if (parts.length !== 4) return null;
  const ints = parts.map((p) => Number(p));
  if (ints.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (
    ((ints[0] << 24) >>> 0) +
    ((ints[1] << 16) >>> 0) +
    ((ints[2] << 8) >>> 0) +
    (ints[3] >>> 0)
  ) >>> 0;
}

export async function loadDisposableDomains(log) {
  if (cache.disposableDomains) {
    log?.("Using cached Datasets/domains.json", {
      source: "dataset",
      dataset: "domains.json",
      cache: "hit",
      entries: cache.disposableDomains.size,
    });
    return cache.disposableDomains;
  }

  log?.("Loading Datasets/domains.json", {
    source: "dataset",
    dataset: "domains.json",
    cache: "miss",
  });
  const raw = await readFile(datasetPath("domains.json"), "utf8");
  const arr = JSON.parse(raw);
  cache.disposableDomains = new Set(arr.map((d) => String(d).toLowerCase()));
  log?.(`Loaded domains.json (${cache.disposableDomains.size} domain(s))`, {
    source: "dataset",
    dataset: "domains.json",
    entries: cache.disposableDomains.size,
  });
  return cache.disposableDomains;
}

export async function loadSherlockPlatforms(log) {
  if (cache.sherlockPlatforms) {
    log?.("Using cached Datasets/data.json", {
      source: "dataset",
      dataset: "data.json",
      cache: "hit",
      entries: cache.sherlockPlatforms.length,
    });
    return cache.sherlockPlatforms;
  }

  log?.("Loading Datasets/data.json", {
    source: "dataset",
    dataset: "data.json",
    cache: "miss",
  });
  const raw = await readFile(datasetPath("data.json"), "utf8");
  const json = JSON.parse(raw);
  const platforms = Object.entries(json)
    .filter(([, info]) => info && typeof info.url === "string")
    .map(([name, info]) => ({
      name,
      url: String(info.url).replaceAll("{}", "{username}"),
      errorType: info.errorType || "status_code",
      errorMsg: info.errorMsg || null,
      regexCheck: info.regexCheck || null,
      nsfw: Boolean(info.isNSFW),
    }));

  cache.sherlockPlatforms = platforms;
  log?.(`Loaded data.json (${platforms.length} platform template(s))`, {
    source: "dataset",
    dataset: "data.json",
    entries: platforms.length,
  });
  return platforms;
}

export async function loadTopDomainsSet(log) {
  if (cache.topDomainsSet) {
    log?.("Using cached Datasets/top-1m-domains.csv", {
      source: "dataset",
      dataset: "top-1m-domains.csv",
      cache: "hit",
      entries: cache.topDomainsSet.size,
    });
    return cache.topDomainsSet;
  }

  log?.("Loading Datasets/top-1m-domains.csv", {
    source: "dataset",
    dataset: "top-1m-domains.csv",
    cache: "miss",
  });
  const raw = await readFile(datasetPath("top-1m-domains.csv"), "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => normalizeDomain(line))
    .filter(Boolean);
  cache.topDomainsSet = new Set(lines);
  log?.(`Loaded top-1m-domains.csv (${cache.topDomainsSet.size} domain(s))`, {
    source: "dataset",
    dataset: "top-1m-domains.csv",
    entries: cache.topDomainsSet.size,
  });
  return cache.topDomainsSet;
}

export async function loadSecurityIndex(log) {
  if (cache.securityIndex) {
    log?.("Using cached Datasets/security.csv", {
      source: "dataset",
      dataset: "security.csv",
      cache: "hit",
      entries: cache.securityIndex.size,
    });
    return cache.securityIndex;
  }

  log?.("Loading Datasets/security.csv", {
    source: "dataset",
    dataset: "security.csv",
    cache: "miss",
  });
  const raw = await readFile(datasetPath("security.csv"), "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const domainIdx = headers.indexOf("domain_name");
  const typeIdx = headers.indexOf("tipo");
  const serverIdx = headers.indexOf("server");
  const out = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const domain = normalizeDomain(cols[domainIdx]);
    if (!domain) continue;
    const row = {
      domain,
      label: String(cols[typeIdx] || "").trim().toLowerCase(),
      server: String(cols[serverIdx] || "").trim() || null,
    };
    if (!out.has(domain)) out.set(domain, []);
    out.get(domain).push(row);
  }

  cache.securityIndex = out;
  log?.(`Loaded security.csv (${out.size} unique domain(s))`, {
    source: "dataset",
    dataset: "security.csv",
    entries: out.size,
  });
  return out;
}

export async function findPhishTankMatches(domain, log, limit = 20) {
  const target = normalizeDomain(domain);
  if (!target) return [];

  log?.(`Scanning Datasets/phisetank-dataset-phising.csv for ${target}`, {
    source: "dataset",
    dataset: "phisetank-dataset-phising.csv",
    domain: target,
  });

  const matches = [];
  const stream = fs.createReadStream(datasetPath("phisetank-dataset-phising.csv"), "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let isHeader = true;
  let checked = 0;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    checked += 1;
    const cols = splitCsvLine(line);
    const url = cols[1];
    if (!url) continue;
    try {
      const host = normalizeDomain(new URL(url).hostname);
      if (host === target || host.endsWith(`.${target}`) || target.endsWith(`.${host}`)) {
        matches.push({
          phishId: cols[0],
          url,
          detailUrl: cols[2],
          submissionTime: cols[3],
          verified: cols[4],
          online: cols[6],
          target: cols[7],
        });
      }
    } catch {
      // ignore malformed row
    }
    if (matches.length >= limit) break;
  }

  rl.close();
  stream.destroy();
  log?.(`PhishTank scan complete for ${target}: ${matches.length} hit(s)`, {
    source: "dataset",
    dataset: "phisetank-dataset-phising.csv",
    checkedRows: checked,
    hits: matches.length,
  });
  return matches;
}

export async function loadBreachEntities(log) {
  if (cache.breachEntities) {
    log?.("Using cached Datasets/breach-leak simulation dataset.csv", {
      source: "dataset",
      dataset: "breach-leak simulation dataset.csv",
      cache: "hit",
      entries: cache.breachEntities.length,
    });
    return cache.breachEntities;
  }

  log?.("Loading Datasets/breach-leak simulation dataset.csv", {
    source: "dataset",
    dataset: "breach-leak simulation dataset.csv",
    cache: "miss",
  });
  const raw = await readFile(datasetPath("breach-leak simulation dataset.csv"), "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const entityIdx = headers.indexOf("entity");
  const yearIdx = headers.indexOf("year");
  const recordsIdx = headers.indexOf("records");

  const out = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const entity = String(cols[entityIdx] || "").trim();
    if (!entity) continue;
    out.push({
      entity,
      normalized: entity.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
      year: cols[yearIdx],
      records: cols[recordsIdx],
    });
  }
  cache.breachEntities = out;
  log?.(`Loaded breach dataset (${out.length} record(s))`, {
    source: "dataset",
    dataset: "breach-leak simulation dataset.csv",
    entries: out.length,
  });
  return out;
}

export async function loadBettingWatchlist(log) {
  if (cache.bettingWatchlist) {
    log?.("Using cached Datasets/illegal-betting-watchlist.json", {
      source: "dataset",
      dataset: "illegal-betting-watchlist.json",
      cache: "hit",
      entries: cache.bettingWatchlist.length,
    });
    return cache.bettingWatchlist;
  }

  log?.("Loading Datasets/illegal-betting-watchlist.json", {
    source: "dataset",
    dataset: "illegal-betting-watchlist.json",
    cache: "miss",
  });

  const raw = await readFile(datasetPath("illegal-betting-watchlist.json"), "utf8");
  const json = JSON.parse(raw);
  const entries = Array.isArray(json?.entries) ? json.entries : [];

  cache.bettingWatchlist = entries.map((entry) => ({
    brand: String(entry.brand || "").trim(),
    aliases: Array.isArray(entry.aliases)
      ? entry.aliases.map((v) => String(v || "").trim()).filter(Boolean)
      : [],
    domains: Array.isArray(entry.domains)
      ? entry.domains.map((v) => normalizeDomain(v)).filter(Boolean)
      : [],
    severity: String(entry.severity || "critical").toLowerCase(),
    region: Array.isArray(entry.region) ? entry.region.map((v) => String(v || "").trim()) : [],
    category: String(entry.category || "betting").trim(),
  }));

  log?.(`Loaded illegal-betting-watchlist.json (${cache.bettingWatchlist.length} entry(s))`, {
    source: "dataset",
    dataset: "illegal-betting-watchlist.json",
    entries: cache.bettingWatchlist.length,
  });

  return cache.bettingWatchlist;
}

export async function lookupDbipCountry(ip, log) {
  const target = toIpInt(ip);
  if (target === null) {
    return null;
  }

  log?.(`Scanning Datasets/dbip-country-lite-2026-04.csv for ${ip}`, {
    source: "dataset",
    dataset: "dbip-country-lite-2026-04.csv",
    ip,
  });

  const stream = fs.createReadStream(datasetPath("dbip-country-lite-2026-04.csv"), "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let checked = 0;
  for await (const line of rl) {
    checked += 1;
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length < 3) continue;

    const start = toIpInt(cols[0]);
    const end = toIpInt(cols[1]);
    if (start === null || end === null) continue;

    if (target >= start && target <= end) {
      const match = {
        startIp: cols[0],
        endIp: cols[1],
        countryCode: cols[2],
      };
      rl.close();
      stream.destroy();
      log?.(`DBIP match found for ${ip}: ${match.countryCode}`, {
        source: "dataset",
        dataset: "dbip-country-lite-2026-04.csv",
        checkedRows: checked,
        countryCode: match.countryCode,
      });
      return match;
    }

    if (start > target) {
      break;
    }
  }

  rl.close();
  stream.destroy();
  log?.(`DBIP scan complete for ${ip}: no match`, {
    source: "dataset",
    dataset: "dbip-country-lite-2026-04.csv",
    checkedRows: checked,
  });
  return null;
}

export function extractDomainRoot(domain) {
  const normalized = normalizeDomain(domain);
  if (!normalized) return "";
  const parts = normalized.split(".");
  if (parts.length <= 2) return parts[0] || "";
  return parts[parts.length - 2] || "";
}
