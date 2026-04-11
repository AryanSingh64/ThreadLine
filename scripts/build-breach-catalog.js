#!/usr/bin/env node
/**
 * Converts breach_metadata.json (966 real HIBP records) to
 * breaches_catalog.json format used by the /breaches page.
 */
const fs = require("fs");
const path = require("path");

const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/breach_metadata.json"), "utf-8"));

function severity(pwnCount, dataClasses = []) {
  const dc = dataClasses.map((d) => d.toLowerCase());
  const hasPasswords = dc.some((d) => d.includes("password"));
  const hasCreditCard = dc.some((d) => d.includes("credit") || d.includes("card"));
  const hasSsn = dc.some((d) => d.includes("social security") || d.includes("ssn"));

  if (hasCreditCard || hasSsn || pwnCount >= 100_000_000) return "critical";
  if (hasPasswords && pwnCount >= 10_000_000) return "critical";
  if (hasPasswords && pwnCount >= 1_000_000) return "high";
  if (pwnCount >= 10_000_000) return "high";
  if (pwnCount >= 1_000_000) return "moderate";
  return "low";
}

function formatCount(n) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const catalog = meta.map((b) => {
  const dateObj = b.breachDate ? new Date(b.breachDate) : null;
  const year  = dateObj ? String(dateObj.getFullYear()) : "Unknown";
  const month = dateObj ? MONTHS[dateObj.getMonth()] : "";

  return {
    id:             b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name:           b.title || b.name,
    domain:         b.domain || null,
    date:           b.breachDate || null,
    year,
    month,
    description:    b.description || `The ${b.title || b.name} data breach exposed user records from ${b.domain || "unknown service"}.`,
    compromisedData: b.dataClasses || [],
    recordCount:    b.pwnCount ? formatCount(b.pwnCount) + " accounts" : null,
    pwnCount:       b.pwnCount || 0,
    uniqueEmails:   b.pwnCount ? formatCount(b.pwnCount) : null,
    severity:       severity(b.pwnCount || 0, b.dataClasses || []),
    isVerified:     b.isVerified ?? true,
    isSensitive:    b.isSensitive ?? false,
    logoPath:       b.logoPath || null,
    simulated:      false,
  };
})
// Sort by date descending
.sort((a, b) => {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(b.date) - new Date(a.date);
});

fs.writeFileSync(
  path.join(__dirname, "../data/breaches_catalog.json"),
  JSON.stringify(catalog, null, 2)
);

console.log(`✓ Generated ${catalog.length} breach records → data/breaches_catalog.json`);

// Print severity breakdown
const sevCount = catalog.reduce((acc, b) => { acc[b.severity] = (acc[b.severity] || 0) + 1; return acc; }, {});
console.log("  Severity:", JSON.stringify(sevCount));
const totalPwn = catalog.reduce((sum, b) => sum + (b.pwnCount || 0), 0);
console.log(`  Total accounts pwned: ~${(totalPwn / 1_000_000_000).toFixed(1)}B`);
