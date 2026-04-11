/**
 * Cross-platform username threat scoring engine.
 * Consumes standardized platformResults array from usernameEnum.js.
 */

const HIGH_VALUE_CLUSTER = new Set(["GitHub", "Reddit", "LinkedIn"]);

// Platforms considered "dark web adjacent" for flagging only
const DARK_WEB_ADJACENT = new Set(["Dread", "HiddenAnswers"]);

/**
 * Score a set of platform discoveries + metadata.
 *
 * @param {object} params
 * @param {Array}  params.discovered       - usernameEnum discovered profiles
 * @param {Array}  params.variations       - username variation hits
 * @param {object} params.githubMeta       - { repos, followers, account_age_days, contributions }
 * @param {object} params.redditMeta       - { comment_karma, link_karma, account_age_days }
 * @param {string} params.username         - base username input
 * @param {object} params.threatIndicators - content of threat_indicators.json
 */
export function scoreUsername({ discovered = [], variations = [], githubMeta = null, redditMeta = null, username = "", threatIndicators = [] }) {
  let score = 0;
  const signals = [];

  // PRESENCE signals
  score += discovered.length * 5;
  if (discovered.length > 0) signals.push(`Found on ${discovered.length} platform(s) (+${discovered.length * 5})`);

  // High-value identity cluster
  const foundPlatforms = new Set(discovered.map((d) => d.platform));
  const clusterHits = [...HIGH_VALUE_CLUSTER].filter((p) => foundPlatforms.has(p));
  if (clusterHits.length >= 2) {
    score += 10;
    signals.push(`High-value identity cluster: ${clusterHits.join(", ")} (+10)`);
  }

  // Dark-web adjacent platforms
  const darkWebHits = discovered.filter((d) => DARK_WEB_ADJACENT.has(d.platform));
  if (darkWebHits.length > 0) {
    score += 8 * darkWebHits.length;
    signals.push(`Dark-web adjacent platform(s) detected (+${8 * darkWebHits.length})`);
  }

  // Variations found
  if (variations.length > 0) {
    const bonus = Math.min(variations.length * 5, 20);
    score += bonus;
    signals.push(`${variations.length} username variation(s) found (+${bonus})`);
  }

  // CONTENT signals — GitHub
  if (githubMeta) {
    const { repos = 0, followers = 0, account_age_days = 9999, contributions = null } = githubMeta;
    if (repos === 0 && followers >= 100) {
      score += 15;
      signals.push("GitHub: 0 repos but 100+ followers — suspicious (+15)");
    }
    if (account_age_days < 30) {
      score += 10;
      signals.push("GitHub: Account created < 30 days ago (+10)");
    }
    if (contributions === 0 && followers > 20) {
      score += 8;
      signals.push("GitHub: No contributions but watches security repos (+8)");
    }
  }

  // CONTENT signals — Reddit
  if (redditMeta) {
    const { comment_karma = 0, account_age_days = 9999 } = redditMeta;
    if (comment_karma < 0) {
      score += 12;
      signals.push("Reddit: Negative karma — potential abuse account (+12)");
    }
    if (account_age_days < 30) {
      score += 10;
      signals.push("Reddit: Account created < 30 days ago (+10)");
    }
  }

  // ANOMALY signals
  if (Array.isArray(threatIndicators)) {
    const match = threatIndicators.some(
      (t) => String(t.value || t.indicator || "").toLowerCase() === username.toLowerCase()
    );
    if (match) {
      score += 15;
      signals.push("Username matches threat indicator database (+15)");
    }
  }

  // Clamp 0–100
  score = Math.min(100, Math.max(0, score));

  let label, color;
  if (score <= 30) { label = "Low Risk"; color = "#34d399"; }
  else if (score <= 60) { label = "Moderate"; color = "#fbbf24"; }
  else if (score <= 80) { label = "High Risk"; color = "#fb7185"; }
  else { label = "Critical"; color = "#ff3366"; }

  return { score, label, color, signals };
}
