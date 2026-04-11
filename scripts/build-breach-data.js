/**
 * ThreadLine Build Script: Breach Data Generator
 *
 * Reads Datasets/HAVEibeenpawneddataset.JSON (971 real HIBP breaches)
 * to generate:
 *   1. data/breach_metadata.json   — all 971 breach records, cleaned
 *   2. data/breach_emails.json     — 600+ synthetic emails w/ real SHA-1 + real breach names
 *   3. data/breach_hashes.json     — k-anonymity index (prefix → hash records)
 *   4. data/email_domain_breaches.json — domain → breach mapping
 */

const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const RAW_HIBP = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../Datasets/HAVEibeenpawneddataset.JSON"), "utf8")
);

// ─── 1. BREACH METADATA ────────────────────────────────────────────────
const breachMetadata = RAW_HIBP.filter((b) => !b.IsFabricated && !b.IsRetired).map((b) => ({
  name: b.Name,
  title: b.Title,
  domain: b.Domain || "",
  breachDate: b.BreachDate,
  pwnCount: b.PwnCount,
  dataClasses: b.DataClasses || [],
  description: (b.Description || "").replace(/<[^>]+>/g, "").slice(0, 300),
  isVerified: b.IsVerified,
  isSensitive: b.IsSensitive,
  isSpamList: b.IsSpamList,
  logoPath: b.LogoPath || "",
}));

fs.writeFileSync(
  path.join(__dirname, "../data/breach_metadata.json"),
  JSON.stringify(breachMetadata, null, 2)
);
console.log(`✅ breach_metadata.json — ${breachMetadata.length} breaches`);

// ─── HELPER: pick a severity for a breach record ──────────────────────
function severityFor(breach) {
  if (!breach) return "medium";
  const count = breach.PwnCount || 0;
  const dc = breach.DataClasses || [];
  const hasPwd = dc.some((c) => c.toLowerCase().includes("password"));
  if (count > 50_000_000 && hasPwd) return "critical";
  if (count > 10_000_000 && hasPwd) return "high";
  if (count > 1_000_000) return "high";
  if (count > 100_000) return "medium";
  return "low";
}

// Real well-known breaches to assign to synthetic emails
const PROMINENT = [
  "Adobe", "LinkedIn", "Canva", "Dropbox", "Tumblr", "MySpace", "Animoto",
  "500px", "ApexSMS", "Apollo", "Badoo", "BitTorrent", "Bitly", "CafePress",
  "Bukalapak", "BlankMediaGames", "ArmorGames", "Appen", "Aptoide",
  "bigbasket", "Bookchor", "BookCrossing", "AshleyMadison", "AntiPublic",
].map((name) => RAW_HIBP.find((b) => b.Name === name)).filter(Boolean);

function pickBreaches(seed, count = 2) {
  const out = [];
  const used = new Set();
  for (let i = 0; i < PROMINENT.length && out.length < count; i++) {
    const idx = (seed + i * 7) % PROMINENT.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(PROMINENT[idx]);
    }
  }
  return out;
}

function sha1(text) {
  return createHash("sha1").update(text.toLowerCase().trim()).digest("hex").toUpperCase();
}

// ─── 2. SYNTHETIC EMAIL LIST ──────────────────────────────────────────
const FIRST_NAMES = [
  "john", "jane", "admin", "user", "test", "support", "contact", "info",
  "rahul", "aryan", "priya", "amit", "neha", "vikram", "ananya", "ravi",
  "dev", "alex", "chris", "sam", "mike", "david", "sarah", "emily",
  "james", "robert", "michael", "jessica", "ashley", "taylor", "jordan",
  "kumar", "singh", "sharma", "patel", "raj", "suresh", "sunita", "pooja",
  "mark", "paul", "lisa", "anna", "kate", "matt", "tom", "tim", "ben",
];

const LAST_NAMES = [
  "doe", "smith", "jones", "brown", "wilson", "taylor", "anderson",
  "kumar", "sharma", "patel", "singh", "verma", "gupta", "rao",
  "dev", "coder", "programmer", "designer", "engineer", "manager",
];

const SUFFIXES = [
  "", "", "", "", // blank = many plain entries
  "1", "2", "123", "007", "99",
  "2001", "2000", "1999", "2003", "1998",
  "_dev", "_official", "tv", "writes",
];

const DOMAINS = [
  "gmail.com", "gmail.com", "gmail.com",  // weight
  "yahoo.com", "outlook.com",
  "hotmail.com", "protonmail.com",
  "icloud.com", "aol.com",
];

const breachEmails = [];
let emailSeed = 0;

function makeEmail(local, domain) {
  return `${local}@${domain}`;
}

// Generate structured emails
for (const first of FIRST_NAMES) {
  for (const domain of DOMAINS.slice(0, 3)) { // limit inner loop
    const suffixA = SUFFIXES[emailSeed % SUFFIXES.length];
    const local = `${first}${suffixA}`;
    const email = makeEmail(local, domain);
    const hash = sha1(email);
    const b = pickBreaches(emailSeed, 2 + (emailSeed % 2));
    breachEmails.push({
      email,
      sha1: hash,
      username: local,
      breaches: b.map((breach) => ({
        name: breach.Title,
        date: breach.BreachDate,
        dataExposed: (breach.DataClasses || []).slice(0, 4),
        recordCount: breach.PwnCount,
        severity: severityFor(breach),
      })),
    });
    emailSeed++;
  }
}

// Compound name  (john.doe, john_doe etc.)
for (let f = 0; f < FIRST_NAMES.length; f++) {
  for (let l = 0; l < Math.min(LAST_NAMES.length, 5); l++) {
    const separators = [".", "_", "-", ""];
    for (const sep of separators.slice(0, 2)) {
      const domain = DOMAINS[(f + l) % DOMAINS.length];
      const local = `${FIRST_NAMES[f]}${sep}${LAST_NAMES[l]}`;
      const email = makeEmail(local, domain);
      const hash = sha1(email);
      const b = pickBreaches(f + l, 2);
      breachEmails.push({
        email,
        sha1: hash,
        username: local,
        breaches: b.map((breach) => ({
          name: breach.Title,
          date: breach.BreachDate,
          dataExposed: (breach.DataClasses || []).slice(0, 4),
          recordCount: breach.PwnCount,
          severity: severityFor(breach),
        })),
      });
      emailSeed++;
    }
  }
}

// Admin / generic accounts
const GENERICS = ["admin", "administrator", "webmaster", "root", "noreply", "contact", "info", "help"];
for (const g of GENERICS) {
  for (const d of DOMAINS.slice(0, 4)) {
    const email = makeEmail(g, d);
    const hash = sha1(email);
    const b = pickBreaches(emailSeed, 3);
    breachEmails.push({
      email,
      sha1: hash,
      username: g,
      breaches: b.map((breach) => ({
        name: breach.Title,
        date: breach.BreachDate,
        dataExposed: (breach.DataClasses || []).slice(0, 4),
        recordCount: breach.PwnCount,
        severity: severityFor(breach),
      })),
    });
    emailSeed++;
  }
}

// Deduplicate
const seen = new Set();
const uniqueEmails = breachEmails.filter((entry) => {
  if (seen.has(entry.email)) return false;
  seen.add(entry.email);
  return true;
});

fs.writeFileSync(
  path.join(__dirname, "../data/breach_emails.json"),
  JSON.stringify(uniqueEmails, null, 2)
);
console.log(`✅ breach_emails.json — ${uniqueEmails.length} entries`);

// ─── 3. K-ANONYMITY HASH INDEX ────────────────────────────────────────
const hashIndex = {};
for (const entry of uniqueEmails) {
  const prefix = entry.sha1.slice(0, 5);
  if (!hashIndex[prefix]) hashIndex[prefix] = [];
  for (const breach of entry.breaches) {
    hashIndex[prefix].push({
      hash: entry.sha1,
      breach: breach.name,
      severity: breach.severity,
      dataExposed: breach.dataExposed,
      recordCount: breach.recordCount,
      date: breach.date,
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, "../data/breach_hashes.json"),
  JSON.stringify(hashIndex, null, 2)
);
console.log(`✅ breach_hashes.json — ${Object.keys(hashIndex).length} prefix buckets`);

// ─── 4. DOMAIN → BREACH MAP ───────────────────────────────────────────
const domainMap = {};

// providers naturally affected by large credential stuffing lists
const PROVIDER_MAP = {
  "gmail.com":      ["Adobe", "LinkedIn", "Collection #1", "AntiPublic", "Canva", "Apollo"],
  "yahoo.com":      ["Adobe", "AntiPublic", "Badoo", "CafePress"],
  "hotmail.com":    ["Adobe", "AntiPublic", "LinkedIn", "Bitly"],
  "outlook.com":    ["Adobe", "AntiPublic", "LinkedIn"],
  "protonmail.com": ["AntiPublic", "BreachForums"],
  "aol.com":        ["Adobe", "MySpace", "AntiPublic"],
  "icloud.com":     ["Adobe", "LinkedIn", "AntiPublic"],
};

for (const [providerDomain, names] of Object.entries(PROVIDER_MAP)) {
  const resolved = names
    .map((n) => {
      const b = RAW_HIBP.find((rb) => rb.Name === n || rb.Title === n);
      if (!b) return null;
      return {
        name: b.Title,
        date: b.BreachDate,
        pwnCount: b.PwnCount,
        dataClasses: (b.DataClasses || []).slice(0, 5),
        severity: severityFor(b),
      };
    })
    .filter(Boolean);
  domainMap[providerDomain] = resolved;
}

// also index every HIBP breach that has a domain
for (const breach of RAW_HIBP) {
  if (!breach.Domain) continue;
  const d = breach.Domain.toLowerCase().trim();
  if (!domainMap[d]) domainMap[d] = [];
  domainMap[d].push({
    name: breach.Title,
    date: breach.BreachDate,
    pwnCount: breach.PwnCount,
    dataClasses: (breach.DataClasses || []).slice(0, 5),
    severity: severityFor(breach),
  });
}

fs.writeFileSync(
  path.join(__dirname, "../data/email_domain_breaches.json"),
  JSON.stringify(domainMap, null, 2)
);
console.log(`✅ email_domain_breaches.json — ${Object.keys(domainMap).length} domains mapped`);

console.log("\n🎉 All breach datasets built successfully.");
