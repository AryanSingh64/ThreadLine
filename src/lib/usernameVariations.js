/**
 * Username variation generator.
 * Given a base username, produces dozens of realistic variations.
 */

export function generateVariations(username) {
  if (!username || typeof username !== "string") return [];
  const base = username.toLowerCase().trim();

  const variations = new Set();
  variations.add(base);

  // ─── Separator variations (only if looks compound) ───────────────────
  // Try splitting on common separators
  const splitPoints = [];
  for (let i = 2; i < base.length - 1; i++) {
    const left = base.slice(0, i);
    const right = base.slice(i);
    if (left.length >= 2 && right.length >= 2) {
      splitPoints.push([left, right]);
    }
  }
  // Only generate separator variants for the first 2 split points to avoid explosion
  for (const [left, right] of splitPoints.slice(0, 2)) {
    variations.add(`${left}.${right}`);
    variations.add(`${left}_${right}`);
    variations.add(`${left}-${right}`);
    variations.add(`${left}${right}`); // no separator (re-adds base sometimes)
  }

  // ─── Remove existing separators ──────────────────────────────────────
  variations.add(base.replace(/[._-]/g, ""));
  variations.add(base.replace(/[._-]/g, "_"));
  variations.add(base.replace(/[._-]/g, "."));

  // ─── Case variations ──────────────────────────────────────────────────
  const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
  variations.add(capitalized);
  variations.add(base.toUpperCase());       // JOHNDOE — skip for most platforms

  // ─── Number suffixes ─────────────────────────────────────────────────
  for (const n of ["1", "2", "3", "7", "99", "100", "123", "007",
                    "1234", "2001", "2000", "2003", "1999", "2002",
                    "2023", "2024", "_1", "_2", "_3"]) {
    variations.add(`${base}${n}`);
  }

  // ─── Prefix patterns ─────────────────────────────────────────────────
  for (const prefix of ["_", "real_", "official_", "the_", "its_", "im_", "iam_"]) {
    variations.add(`${prefix}${base}`);
  }

  // ─── Suffix patterns ─────────────────────────────────────────────────
  for (const suffix of ["_", "__", "xo", "tv", "live", "official",
                         "writes", "dev", "codes", "design", "art", "ig"]) {
    variations.add(`${base}${suffix}`);
    variations.add(`${base}_${suffix}`);
  }

  // ─── Leetspeak variants ───────────────────────────────────────────────
  const leet = base
    .replace(/a/g, "4")
    .replace(/e/g, "3")
    .replace(/i/g, "1")
    .replace(/o/g, "0")
    .replace(/s/g, "5")
    .replace(/t/g, "7");
  if (leet !== base) variations.add(leet);

  // ─── Common additions ─────────────────────────────────────────────────
  for (const addition of ["writes", "dev", "codes", "design", "art", "hq", "network"]) {
    variations.add(`${base}${addition}`);
  }

  // Filter out very short or very long results
  return [...variations].filter(
    (v) => v.length >= 3 && v.length <= 48 && v !== base
  );
}
