import { loadSherlockPlatforms } from "../datasetSources";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  timeoutSignal,
  withRootEdge,
} from "./utils";

const HIGH_SIGNAL_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "reddit.com",
  "www.reddit.com",
  "instagram.com",
  "www.instagram.com",
  "x.com",
  "twitter.com",
  "www.twitter.com",
  "www.linkedin.com",
  "linkedin.com",
  "dev.to",
  "medium.com",
  "www.youtube.com",
  "youtube.com",
  "www.tiktok.com",
  "tiktok.com",
  "www.pinterest.com",
  "pinterest.com",
  "codepen.io",
  "stackoverflow.com",
  "www.stackoverflow.com",
  "hackerone.com",
  "bugcrowd.com",
  "leetcode.com",
  "www.hackerrank.com",
  "hackerrank.com",
  "hashnode.com",
  "huggingface.co",
  "hub.docker.com",
  "www.flickr.com",
  "flickr.com",
  "www.behance.net",
  "behance.net",
  "dribbble.com",
  "www.chess.com",
  "chess.com",
  "lichess.org",
  "www.twitch.tv",
  "twitch.tv",
  "soundcloud.com",
  "steamcommunity.com",
  "www.roblox.com",
  "roblox.com",
  "www.patreon.com",
  "patreon.com",
  "unsplash.com",
  "vsco.co",
  "www.figma.com",
  "figma.com",
  "www.canva.com",
  "canva.com",
  "www.buymeacoffee.com",
  "buymeacoffee.com",
  "linktr.ee",
  "www.snapchat.com",
  "snapchat.com",
  "www.threads.net",
  "threads.net",
  "bsky.app",
  "mastodon.social",
  "keybase.io",
  "t.me",
  "www.npmjs.com",
  "npmjs.com",
  "pypi.org",
  "www.deviantart.com",
  "deviantart.com",
  "www.kaggle.com",
  "kaggle.com",
  "www.producthunt.com",
  "producthunt.com",
  "vimeo.com",
  "www.vimeo.com",
  "replit.com",
  "www.replit.com",
  // ─── Competitive Programming / Coding ───
  "www.codechef.com",
  "codechef.com",
  "www.codewars.com",
  "codewars.com",
  "exercism.org",
  "www.codingame.com",
  "codingame.com",
  "www.hackerearth.com",
  "hackerearth.com",
  "www.spoj.com",
  "spoj.com",
  "projecteuler.net",
  // ─── Dating / Social Discovery ───
  "www.okcupid.com",
  "okcupid.com",
  "badoo.com",
  "www.badoo.com",
  "www.tagged.com",
  "tagged.com",
  "www.zoosk.com",
  "zoosk.com",
  // ─── Fitness / Health ───
  "www.strava.com",
  "strava.com",
  "www.myfitnesspal.com",
  "myfitnesspal.com",
  "www.fitocracy.com",
  "fitocracy.com",
  "www.zwift.com",
  "zwift.com",
  // ─── Writing / Fan Fiction ───
  "www.royalroad.com",
  "royalroad.com",
  "archiveofourown.org",
  "www.scribblehub.com",
  "scribblehub.com",
  "www.inkitt.com",
  "inkitt.com",
  "commaful.com",
  "www.fanfiction.net",
  "fanfiction.net",
  // ─── Gaming ───
  "my.playstation.com",
  "itch.io",
  "www.itch.io",
  "gamebanana.com",
  "www.gamebanana.com",
  "www.nexusmods.com",
  "nexusmods.com",
  "www.speedrun.com",
  "speedrun.com",
  "assetstore.unity.com",
  // ─── Music / Audio ───
  "www.mixcloud.com",
  "mixcloud.com",
  "www.reverbnation.com",
  "reverbnation.com",
  // ─── Photography / Art ───
  "www.artstation.com",
  "artstation.com",
  "www.eyeem.com",
  "eyeem.com",
]);

// Known redirect patterns: if the final URL still contains the username, it's likely valid
const USERNAME_IN_REDIRECT_HOSTS = new Set([
  "instagram.com", "www.instagram.com",
  "github.com",
  "twitter.com", "www.twitter.com", "x.com",
  "linkedin.com", "www.linkedin.com",
  "tiktok.com", "www.tiktok.com",
  "pinterest.com", "www.pinterest.com",
  "twitch.tv", "www.twitch.tv",
  "youtube.com", "www.youtube.com",
  "reddit.com", "www.reddit.com",
  "medium.com",
  "dev.to",
  "behance.net", "www.behance.net",
  "dribbble.com",
  "vimeo.com", "www.vimeo.com",
  "codepen.io",
  "stackoverflow.com", "www.stackoverflow.com",
  "hackerone.com",
  "bugcrowd.com",
  "leetcode.com",
  "hackerrank.com", "www.hackerrank.com",
  "hashnode.com",
  "huggingface.co",
  "hub.docker.com",
  "flickr.com", "www.flickr.com",
  "unsplash.com",
  "soundcloud.com",
  "steamcommunity.com",
  "roblox.com", "www.roblox.com",
  "patreon.com", "www.patreon.com",
  "figma.com", "www.figma.com",
  "canva.com", "www.canva.com",
  "buymeacoffee.com", "www.buymeacoffee.com",
  "linktr.ee",
  "snapchat.com", "www.snapchat.com",
  "threads.net", "www.threads.net",
  "bsky.app",
  "mastodon.social",
  "keybase.io",
  "t.me",
  "npmjs.com", "www.npmjs.com",
  "pypi.org",
  "deviantart.com", "www.deviantart.com",
  "kaggle.com", "www.kaggle.com",
  "producthunt.com", "www.producthunt.com",
  "replit.com", "www.replit.com",
  "chess.com", "www.chess.com",
  "lichess.org",
  "vsco.co",
  // ─── Competitive Programming / Coding ───
  "www.codechef.com",
  "codechef.com",
  "www.codewars.com",
  "codewars.com",
  "exercism.org",
  "www.codingame.com",
  "codingame.com",
  "www.hackerearth.com",
  "hackerearth.com",
  "www.spoj.com",
  "spoj.com",
  "projecteuler.net",
  // ─── Dating / Social Discovery ───
  "www.okcupid.com",
  "okcupid.com",
  "badoo.com",
  "www.badoo.com",
  "www.tagged.com",
  "tagged.com",
  "www.zoosk.com",
  "zoosk.com",
  // ─── Fitness / Health ───
  "www.strava.com",
  "strava.com",
  "www.myfitnesspal.com",
  "myfitnesspal.com",
  "www.fitocracy.com",
  "fitocracy.com",
  "www.zwift.com",
  "zwift.com",
  // ─── Writing / Fan Fiction ───
  "www.royalroad.com",
  "royalroad.com",
  "archiveofourown.org",
  "www.scribblehub.com",
  "scribblehub.com",
  "www.inkitt.com",
  "inkitt.com",
  "commaful.com",
  "www.fanfiction.net",
  "fanfiction.net",
  // ─── Gaming ───
  "my.playstation.com",
  "itch.io",
  "www.itch.io",
  "gamebanana.com",
  "www.gamebanana.com",
  "www.nexusmods.com",
  "nexusmods.com",
  "www.speedrun.com",
  "speedrun.com",
  "assetstore.unity.com",
  // ─── Music / Audio ───
  "www.mixcloud.com",
  "mixcloud.com",
  "www.reverbnation.com",
  "reverbnation.com",
  // ─── Photography / Art ───
  "www.artstation.com",
  "artstation.com",
  "www.eyeem.com",
  "eyeem.com",
]);

function hostFromTemplate(urlTemplate) {
  try {
    const url = urlTemplate.replace("{username}", "probe_username");
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function uniqBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function buildCandidateUsernames(input, inputType) {
  const raw =
    inputType === "email" ? String(input).split("@")[0].toLowerCase() : String(input).toLowerCase();
  const variants = [
    raw,
    raw.replace(/[._-]/g, ""),
    raw.replace(/\d+$/g, ""),
    raw.split(/[._-]/)[0],
  ]
    .map((v) => String(v || "").trim())
    .filter((v) => v.length >= 3);
  return [...new Set(variants)];
}

function extractTagText(html, regex) {
  const match = String(html || "").match(regex);
  return match?.[1] ? String(match[1]).toLowerCase() : "";
}

function looksLikeProfilePage({
  lowerBody,
  title,
  canonicalUrl,
  usernameLower,
  usernameInBody,
  usernameInFinalUrl,
  host,
}) {
  // === Signal 1: Username appears in canonical URL or og:url ===
  const usernameInCanonical =
    canonicalUrl.includes(encodeURIComponent(usernameLower)) || canonicalUrl.includes(usernameLower);
  if (usernameInCanonical) return true;

  // === Signal 2: Username appears in page title ===
  const usernameInTitle = title.includes(usernameLower);
  if (usernameInTitle) return true;

  // === Signal 3: Username in final URL + in body ===
  if (usernameInFinalUrl && usernameInBody) return true;

  // === Signal 4: Profile content hints in body ===
  const profileHints = [
    "profile", "member since", "followers", "following", "posts", "joined",
    "bio", "about me", "user profile", "public profile", "portfolio",
    "galleries", "projects", "repositories", "commits",
  ];
  const hintCount = profileHints.reduce(
    (acc, hint) => acc + (lowerBody.includes(hint) ? 1 : 0),
    0
  );
  if (usernameInBody && hintCount >= 2) return true;

  // === Signal 5: Username in final URL for known redirect platforms ===
  if (USERNAME_IN_REDIRECT_HOSTS.has(host) && usernameInFinalUrl) return true;

  return false;
}

async function checkProfile(platform, username, log) {
  const profileUrl = platform.url.replace("{username}", encodeURIComponent(username));
  const host = hostFromTemplate(platform.url);
  const { signal, cleanup } = timeoutSignal(8000);

  try {
    log(`Checking: ${profileUrl}`, {
      source: "website",
      url: profileUrl,
      username,
      method: "GET",
    });

    const response = await fetch(profileUrl, {
      method: "GET",
      redirect: "follow",
      signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ThreadLine/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    const body = await response.text();
    const lowerBody = body.toLowerCase();
    const finalUrl = String(response.url || "").toLowerCase();
    const usernameLower = String(username).toLowerCase();
    const title = extractTagText(lowerBody, /<title[^>]*>([^<]*)<\/title>/i);
    const canonicalUrl =
      extractTagText(
        lowerBody,
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
      ) ||
      extractTagText(
        lowerBody,
        /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i
      );

    // Check platform-specific error messages
    const platformErrorHints = platform.errorMsg
      ? (Array.isArray(platform.errorMsg) ? platform.errorMsg : [platform.errorMsg])
      : [];

    const genericNotFoundHints = [
      "not found",
      "user not found",
      "page not found",
      "this account doesn't exist",
      "doesn't exist",
      "does not exist",
      "no user found",
      "could not find that user",
      "profile unavailable",
      "user does not exist",
      "account not found",
      "page doesn't exist",
      "couldn't find this account",
      "this channel doesn't exist",
      "sorry, nobody on reddit",
      "sorry, this page isn't available",
      "if you have telegram",
    ];

    const hasPlatformError = platformErrorHints.length > 0
      && platformErrorHints.some((msg) => lowerBody.includes(String(msg).toLowerCase()));

    const hasGenericNotFound = genericNotFoundHints.some((hint) => lowerBody.includes(hint));
    const hasExplicitNotFound = hasPlatformError || hasGenericNotFound;

    const usernameInBody = lowerBody.includes(usernameLower);
    const usernameInFinalUrl =
      finalUrl.includes(encodeURIComponent(usernameLower)) || finalUrl.includes(usernameLower);

    const likelyProfile = looksLikeProfilePage({
      lowerBody,
      title,
      canonicalUrl,
      usernameLower,
      usernameInBody,
      usernameInFinalUrl,
      host,
    });

    // Redirect away from username URL = probably not found
    const redirectedAway = !usernameInFinalUrl && String(profileUrl).toLowerCase().includes(usernameLower);

    let exists = false;
    let confidence = "low";

    // If status is 2xx and no explicit not-found message, check profile signals
    if (response.status >= 200 && response.status < 400 && !hasExplicitNotFound && !redirectedAway) {
      if (likelyProfile) {
        exists = true;
        confidence = "high";
      } else if (usernameInBody && response.status < 300) {
        // Weaker signal but still possible
        exists = true;
        confidence = "medium";
      } else if (USERNAME_IN_REDIRECT_HOSTS.has(host) && usernameInFinalUrl && response.status < 300) {
        // Known redirect platform with username in final URL
        exists = true;
        confidence = "medium";
      }
    }

    cleanup();
    return {
      exists,
      status: response.status,
      url: profileUrl,
      confidence,
      username,
      platform: platform.name,
    };
  } catch (error) {
    cleanup();
    log(`Probe failed: ${profileUrl} — ${error.message}`, {
      source: "website",
      url: profileUrl,
      username,
      error: error.message,
    });
    return {
      exists: false,
      status: 0,
      url: profileUrl,
      confidence: "low",
      username,
      platform: platform.name,
      error: error.message,
    };
  }
}

async function runWithConcurrency(items, worker, concurrency = 12) {
  const queue = [...items];
  const results = [];

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const res = await worker(item);
      results.push(res);
    }
  });

  await Promise.all(workers);
  return results;
}

function selectPlatforms(platforms, mode) {
  const normalized = platforms
    .map((platform) => ({
      ...platform,
      host: hostFromTemplate(platform.url),
    }))
    .filter((platform) => platform.host && platform.url.includes("{username}") && !platform.nsfw);

  const highSignal = normalized.filter((platform) => HIGH_SIGNAL_HOSTS.has(platform.host));
  const merged = uniqBy(highSignal, (item) => item.host);

  const deepLimit = Number(process.env.USERNAME_ENUM_LIMIT_DEEP || 150);
  const standardLimit = Number(process.env.USERNAME_ENUM_LIMIT_STANDARD || 70);
  const limit = mode === "deep" ? deepLimit : standardLimit;
  return merged.slice(0, limit);
}

export async function run(input, inputType, options = {}) {
  const mode = options.mode || "standard";
  const result = baseResult("usernameEnum", mode);
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  if (inputType !== "username" && inputType !== "email") {
    result.status = "partial";
    result.summary = "Username enumeration is only useful for username-like inputs.";
    result.timeline = makeTimeline("Username Enumeration", "Skipped: input is not username/email.");
    return result;
  }

  log("Loading platform templates from platform_urls.json", {
    source: "dataset",
    dataset: "platform_urls.json",
  });
  const allPlatforms = await loadSherlockPlatforms(log);
  const platforms = selectPlatforms(allPlatforms, mode);
  const candidates = buildCandidateUsernames(input, inputType);
  const primaryUsername = candidates[0] || String(input || "").toLowerCase();

  const probes = [];
  for (const platform of platforms) {
    probes.push({ platform, username: primaryUsername });
  }
  if (mode === "deep" && candidates.length > 1) {
    const highSignalPlatforms = platforms.slice(0, Math.min(35, platforms.length));
    for (const username of candidates.slice(1)) {
      for (const platform of highSignalPlatforms) {
        probes.push({ platform, username });
      }
    }
  }

  log(
    `Enumerating ${platforms.length} platform(s) with ${candidates.length} username variant(s); ${probes.length} probe(s).`,
    {
      source: "website",
      platforms: platforms.length,
      candidates: candidates.length,
      probes: probes.length,
    }
  );

  const checks = await runWithConcurrency(
    probes,
    async (probe) => checkProfile(probe.platform, probe.username, log),
    12
  );

  const discovered = uniqBy(
    checks.filter((item) => item.exists),
    (item) => `${item.platform}|${item.username}`
  );

  result.data = {
    candidates,
    primaryUsername,
    scannedPlatforms: platforms.length,
    probesExecuted: probes.length,
    discoveredProfiles: discovered,
  };
  result.summary = `Scanned ${platforms.length} platform(s), executed ${probes.length} probe(s), found ${discovered.length} likely profile(s).`;
  result.riskContribution = Math.min(20, discovered.length * 2);
  result.timeline = makeTimeline(
    "Username Enumeration",
    `Detected ${discovered.length} active profile(s) across ${platforms.length} platform(s).`
  );

  discovered.forEach((profile) => {
    const nodeId = `platform:${profile.platform}:${profile.username}`;
    result.nodes.push({
      id: nodeId,
      label: `${profile.platform} (${profile.username})`,
      type: "platform",
      meta: {
        url: profile.url,
        status: profile.status,
        confidence: profile.confidence,
      },
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "active_on"));
  });

  return result;
}

export const checkUsername = run;
