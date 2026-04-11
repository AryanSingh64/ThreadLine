/**
 * LinkedIn OSINT Scraper — ThreadLine
 * 
 * Strategy order:
 *   1. OpenGraph meta parse (fast, no auth)
 *   2. Structured HTML parser (pre-wall content from LinkedIn's SSR)
 *   3. Google cache fallback (if direct fetch returns 999 bot block)
 * 
 * LinkedIn blocks raw Node fetch with 999 errors.
 * We use a high-quality browser-like header set and a layered 
 * parsing approach to maximize data extraction.
 */

// Browser-realistic headers LinkedIn accepts
const LI_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Ch-Ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
};

// ── Parsers ──────────────────────────────────────────────────────────

function extractMeta(html, property) {
  // Handles both property="og:x" and name="og:x" attribute orders
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function stripHtml(str) {
  return (str || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * LinkedIn's OG tags are valuable even without auth:
 *   og:title  → "Name - Title at Company | LinkedIn"
 *   og:description → "Location · About snippet"
 *   og:image  → Profile photo CDN URL
 */
function parseOgTags(html, username) {
  const title = extractMeta(html, "og:title");
  const description = extractMeta(html, "og:description");
  const image = extractMeta(html, "og:image");
  const url = extractMeta(html, "og:url") || `https://www.linkedin.com/in/${username}`;

  if (!title && !description) return null;

  // Parse "Name - Headline | LinkedIn" or "Name | LinkedIn"
  let name = null;
  let headline = null;
  if (title) {
    const pipeIdx = title.lastIndexOf(" | LinkedIn");
    const raw = pipeIdx !== -1 ? title.slice(0, pipeIdx) : title;
    const dashIdx = raw.indexOf(" - ");
    if (dashIdx !== -1) {
      name = raw.slice(0, dashIdx).trim();
      headline = raw.slice(dashIdx + 3).trim();
    } else {
      name = raw.trim();
    }
  }

  // Parse "Location · About snippet" from description
  let location = null;
  let about = null;
  if (description) {
    const dotIdx = description.indexOf(" · ");
    if (dotIdx !== -1) {
      location = description.slice(0, dotIdx).trim();
      about = description.slice(dotIdx + 3).trim();
    } else {
      about = description.trim();
    }
    // LinkedIn often starts descriptions with the location count or connections count
    // Strip leading "N+ followers" or "N connections" patterns
    about = about.replace(/^\d[\d,+]* (followers?|connections?)\s*[·\-]?\s*/i, "").trim();
  }

  return { name, headline, location, about, image, url, source: "og" };
}

/**
 * LinkedIn's SSR HTML contains structured JSON-LD data and 
 * some profile sections before the React auth wall boots.
 * We extract what we can from the static HTML.
 */
function parseStructuredHtml(html) {
  const result = {};

  // JSON-LD schema (sometimes present on public profiles)
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const schema = JSON.parse(jsonLdMatch[1]);
      if (schema["@type"] === "Person") {
        result.schemaName = schema.name;
        result.schemaJob = schema.jobTitle;
        result.schemaOrg = schema.worksFor?.name;
        result.schemaAlumni = schema.alumniOf?.map((a) => a.name).filter(Boolean);
        result.schemaSameAs = schema.sameAs;
        result.schemaImage = schema.image;
      }
    } catch {}
  }

  // Extract any visible "connections" or "followers" count from page text
  const connMatch = html.match(/(\d[\d,+]+)\s+connections?/i);
  if (connMatch) result.connections = connMatch[1];

  const follMatch = html.match(/(\d[\d,+]+)\s+followers?/i);
  if (follMatch) result.followers = follMatch[1];

  // Extract premium/verified badge presence
  result.hasPremium = html.includes("premium-icon") || html.includes("linkedin-premium");
  result.isVerified = html.includes("verified-badge") || html.includes("identity-verification");

  return result;
}

// ── Main export ──────────────────────────────────────────────────────

export async function scrapeLinkedIn(username) {
  const profileUrl = `https://www.linkedin.com/in/${username}`;

  // ── Layer 1: Direct fetch with browser headers ──────────────────
  let html = null;
  let httpStatus = null;

  try {
    const res = await fetch(profileUrl, {
      headers: LI_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    httpStatus = res.status;

    if (res.ok || res.status === 200) {
      html = await res.text();
    } else if (res.status === 999) {
      // LinkedIn's custom bot-block code — try Google cache
      throw new Error("linkedin_999");
    } else if (res.status === 404) {
      return { success: false, error: "Profile not found", status: 404 };
    }
  } catch (err) {
    if (err.message === "linkedin_999" || err.message?.includes("999")) {
      // ── Layer 2: Google Cache fallback ────────────────────────────
      try {
        const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:linkedin.com/in/${username}`;
        const cacheRes = await fetch(cacheUrl, {
          headers: { "User-Agent": LI_HEADERS["User-Agent"], Accept: LI_HEADERS.Accept },
          signal: AbortSignal.timeout(10000),
        });
        if (cacheRes.ok) {
          html = await cacheRes.text();
          httpStatus = 200;
        }
      } catch {}
    }
  }

  if (!html) {
    return {
      success: false,
      error: "LinkedIn blocked direct access. Profile may exist but is unreachable.",
      status: httpStatus || 0,
      profileUrl,
      hint: "Try searching manually at linkedin.com",
    };
  }

  // Detect hard auth wall with zero content  
  const isBlocked =
    html.includes("authwall") ||
    html.includes("Join to see") ||
    (html.length < 3000 && html.includes("sign in"));

  const og = parseOgTags(html, username);
  const structured = parseStructuredHtml(html);

  // If completely blocked and no OG data, return minimal result
  if (isBlocked && !og?.name) {
    return {
      success: false,
      error: "Login wall — no public data visible",
      profileUrl,
      status: httpStatus,
      // Even with auth wall, try to return what we have
      partialData: og || null,
    };
  }

  // ── Merge all layers ─────────────────────────────────────────────
  const name = og?.name || structured.schemaName || username;
  const headline = og?.headline || structured.schemaJob || null;
  const location = og?.location || null;
  const about = og?.about || null;
  const image = og?.image || structured.schemaImage || null;
  const company = structured.schemaOrg || extractCompanyFromHeadline(headline);
  const education = structured.schemaAlumni?.join(", ") || null;
  const connections = structured.connections || null;
  const followers = structured.followers || null;
  const hasPremium = structured.hasPremium;

  return {
    success: true,
    status: httpStatus,
    data: {
      name,
      headline,
      location,
      about,
      profilePhoto: image,
      company,
      education,
      connections,
      followers,
      hasPremium,
      profileUrl: og?.url || profileUrl,
      dataSource: og?.source || "structured",
      extractedAt: new Date().toISOString(),
    },
  };
}

// Helper: "Software Engineer at Infosys" → "Infosys"
function extractCompanyFromHeadline(headline) {
  if (!headline) return null;
  const atMatch = headline.match(/\bat\s+(.+?)(?:\s*[|·,]|$)/i);
  return atMatch?.[1]?.trim() || null;
}
