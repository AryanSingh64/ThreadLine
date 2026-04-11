import { NextResponse } from "next/server";
import dns from "dns/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generates common domain permutations / typosquatting variants.
 * Covers: missing dot, char swap, extra char, missing char, hyphenation,
 * common TLD swaps, and homoglyphs that survive ASCII.
 */
function generatePermutations(domain) {
  const parts = domain.split(".");
  const tld = parts.slice(-1)[0];
  const sld = parts.slice(0, -1).join(".");   // second-level parts
  const root = sld.replace(/[-_.]/g, "");      // bare root word

  const altTlds = ["com", "net", "org", "io", "co", "app", "dev", "info", "biz", "xyz", "online", "site"];
  const results = new Set();

  // === TLD swaps ===
  for (const t of altTlds) {
    if (t !== tld) results.add(`${sld}.${t}`);
  }

  // === Hyphen insertion ===
  if (!sld.includes("-")) {
    for (let i = 1; i < sld.length; i++) {
      results.add(`${sld.slice(0, i)}-${sld.slice(i)}.${tld}`);
    }
  }

  // === Prefix / suffix brand abuse ===
  const affixes = ["my", "get", "app", "try", "go", "use", "buy", "the", "real", "official", "secure"];
  for (const a of affixes) {
    results.add(`${a}${root}.${tld}`);
    results.add(`${root}${a}.${tld}`);
    results.add(`${a}-${sld}.${tld}`);
    results.add(`${sld}-${a}.${tld}`);
  }

  // === Missing / double character ===
  for (let i = 0; i < sld.length; i++) {
    // deletion
    results.add(`${sld.slice(0, i)}${sld.slice(i + 1)}.${tld}`);
    // duplication
    results.add(`${sld.slice(0, i)}${sld[i]}${sld[i]}${sld.slice(i + 1)}.${tld}`);
  }

  // === Adjacent key swaps ===
  const qwerty = "qwertyuiopasdfghjklzxcvbnm";
  const adjacentMap = {
    a:"qwsz", b:"vghn", c:"xdfv", d:"ersfxc", e:"wrsdf", f:"rtdgvc",
    g:"tyfhvb", h:"yugjbn", i:"uojk", j:"uihknm", k:"iojml", l:"iopk",
    m:"njk", n:"bhjm", o:"ipkl", p:"ol", q:"wa", r:"etdf", s:"weadzx",
    t:"ryfg", u:"yihj", v:"cfgb", w:"qase", x:"zsdc", y:"tugh", z:"asx",
  };
  for (let i = 0; i < sld.length; i++) {
    const ch = sld[i];
    const neighbors = adjacentMap[ch] || "";
    for (const nb of neighbors) {
      results.add(`${sld.slice(0, i)}${nb}${sld.slice(i + 1)}.${tld}`);
    }
  }

  // === Common homoglyph substitutions ===
  const homoMap = { o: "0", l: "1", i: "1", e: "3", a: "4", s: "5", g: "9" };
  for (let i = 0; i < sld.length; i++) {
    const sub = homoMap[sld[i]];
    if (sub) results.add(`${sld.slice(0, i)}${sub}${sld.slice(i + 1)}.${tld}`);
  }

  // Remove the original domain itself
  results.delete(domain);

  return [...results].slice(0, 120); // cap at 120
}

async function checkDns(domain) {
  try {
    const addrs = await dns.resolve4(domain);
    return { registered: true, ip: addrs[0] || null };
  } catch {
    return { registered: false, ip: null };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase();

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const perms = generatePermutations(domain);

  // DNS check top 40 (balance speed vs coverage)
  const toCheck = perms.slice(0, 40);
  const results = await Promise.all(
    toCheck.map(async (d) => {
      const dns = await checkDns(d);
      return { domain: d, ...dns };
    })
  );

  const registered = results.filter((r) => r.registered);
  const unregistered = perms.filter((d) => !registered.find((r) => r.domain === d));

  return NextResponse.json({
    original: domain,
    totalPermutations: perms.length,
    registered,
    unregistered: unregistered.slice(0, 30),
  });
}
