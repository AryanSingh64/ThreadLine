/**
 * Client-side breach checking utility.
 * Uses k-anonymity: only the first 5 characters of the SHA-1 hash are sent.
 * The full email is never transmitted to the server.
 */

async function sha1Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Performs k-anonymity hash check against local breach database.
 * Returns array of matching breach records, or empty array if clean.
 */
export async function kAnonymityCheck(email) {
  try {
    const hash = await sha1Hex(email);
    const prefix = hash.slice(0, 5);

    const res = await fetch("/api/breach-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix }),
    });

    if (!res.ok) return { hash, matches: [], error: "API error" };

    const data = await res.json();
    const records = data.records || [];

    // Client-side full hash comparison — email never sent to server
    const matches = records.filter((r) => r.hash === hash);
    return { hash, prefix, matches, checked: records.length };
  } catch (err) {
    return { hash: null, matches: [], error: err.message };
  }
}

/**
 * Full breach intelligence check — domain-level + exact email match.
 */
export async function fullBreachCheck(email) {
  try {
    const res = await fetch(`/api/breach-intel?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { error: err.message, exactMatch: { found: false }, domainBreaches: [], metaMatches: [] };
  }
}

/**
 * Combined breach check: runs k-anonymity check + domain-level lookup in parallel.
 */
export async function combinedBreachCheck(email) {
  const [kAnon, fullCheck] = await Promise.all([
    kAnonymityCheck(email),
    fullBreachCheck(email),
  ]);

  const hashBreaches = kAnon.matches || [];
  const exactBreaches = fullCheck.exactMatch?.found ? fullCheck.exactMatch.breaches : [];
  const domainBreaches = fullCheck.domainBreaches || [];
  const metaMatches = fullCheck.metaMatches || [];

  // Merge breach lists
  const allBreaches = [
    ...hashBreaches.map((r) => ({
      name: r.breach,
      date: r.date,
      dataExposed: r.dataExposed,
      recordCount: r.recordCount,
      severity: r.severity,
      source: "hash_match",
    })),
    ...exactBreaches.map((r) => ({ ...r, source: "exact_match" })),
  ];

  // Deduplicate by breach name
  const seen = new Set();
  const uniqueBreaches = allBreaches.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });

  return {
    email,
    exactMatch: fullCheck.exactMatch?.found || kAnon.matches?.length > 0,
    domainMatch: domainBreaches.length > 0 || metaMatches.length > 0,
    breaches: uniqueBreaches,
    domainBreaches,
    metaMatches,
    totalBreachesSearched: fullCheck.totalBreachesSearched || 0,
    privacyNote: "Your email was never transmitted. Checked using k-anonymity SHA-1 prefix matching.",
  };
}
