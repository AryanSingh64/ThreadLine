import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

let metadataCache = null;
let domainMapCache = null;
let emailsCache = null;

function getMetadata() {
  if (metadataCache) return metadataCache;
  metadataCache = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "breach_metadata.json"), "utf8")
  );
  return metadataCache;
}

function getDomainMap() {
  if (domainMapCache) return domainMapCache;
  domainMapCache = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "email_domain_breaches.json"), "utf8")
  );
  return domainMapCache;
}

function getEmails() {
  if (emailsCache) return emailsCache;
  emailsCache = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "breach_emails.json"), "utf8")
  );
  return emailsCache;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get("email") || "").toLowerCase().trim();
  const domainOnly = searchParams.get("domain");

  if (!email && !domainOnly) {
    return NextResponse.json({ error: "email or domain param required" }, { status: 400 });
  }

  try {
    const metadata = getMetadata();
    const domainMap = getDomainMap();

    if (domainOnly) {
      // Return breach metadata for a given domain
      const d = domainOnly.toLowerCase().trim();
      const domainBreaches = domainMap[d] || [];
      // Also search metadata for this domain
      const metaMatches = metadata.filter(
        (b) => b.domain && (b.domain === d || b.domain.includes(d.replace(/\..+$/, "")))
      ).slice(0, 10);
      return NextResponse.json({ domain: d, domainBreaches, metaMatches });
    }

    const [, domain] = email.split("@");

    // Exact email match in synthetic dataset
    const emails = getEmails();
    const exactMatch = emails.find((e) => e.email === email);

    // Domain-level breach lookup
    const domainBreaches = domainMap[domain] || [];

    // Fuzzy: find metadata where domain name appears in breach domain
    const baseName = domain.replace(/\..+$/, ""); // e.g. "gmail" from "gmail.com"
    const metaMatches = metadata
      .filter(
        (b) =>
          b.domain &&
          (b.domain === domain ||
            b.domain.includes(baseName) ||
            baseName.includes(b.domain.replace(/\..+$/, "")))
      )
      .slice(0, 15);

    return NextResponse.json({
      email,
      domain,
      exactMatch: exactMatch
        ? {
            found: true,
            username: exactMatch.username,
            breaches: exactMatch.breaches,
          }
        : { found: false },
      domainBreaches,
      metaMatches,
      totalBreachesSearched: metadata.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
