import dns from "dns/promises";
import crypto from "crypto";
import { loadDisposableDomains } from "../datasetSources";
import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  withRootEdge,
} from "./utils";

const COMMON_PROVIDERS = {
  "gmail.com": "Gmail",
  "outlook.com": "Outlook",
  "hotmail.com": "Hotmail",
  "proton.me": "Proton",
  "protonmail.com": "Proton",
  "yahoo.com": "Yahoo",
};

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function fetchWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function normalizeLocation(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace(/\s+/g, " ").slice(0, 96);
}

function pushLocationClue(clues, next) {
  const location = normalizeLocation(next?.location);
  if (!location) return;
  const source = String(next?.source || "unknown");
  const confidence = next?.confidence || "low";
  const key = `${source}|${location.toLowerCase()}`;
  if (clues.some((item) => `${item.source}|${item.location.toLowerCase()}` === key)) return;
  clues.push({
    source,
    location,
    confidence,
    url: next?.url || null,
  });
}

function githubHeaders() {
  return {
    "user-agent": "ThreadLine/1.0",
    accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function fetchGithubUserProfile(login, log) {
  const url = `https://api.github.com/users/${encodeURIComponent(login)}`;
  try {
    log(`Checking GitHub profile details for ${login}`, {
      source: "website",
      url,
    });
    const response = await fetchWithTimeout(
      url,
      {
        headers: githubHeaders(),
      },
      8000
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return {
      login: payload.login,
      html_url: payload.html_url,
      name: payload.name,
      bio: payload.bio,
      blog: payload.blog,
      location: payload.location,
      company: payload.company,
      followers: payload.followers,
    };
  } catch {
    return null;
  }
}

export async function run(input, inputType, options = {}) {
  const mode = options.mode || "standard";
  const result = baseResult("emailIntel", mode);
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  if (inputType !== "email") {
    result.status = "partial";
    result.summary = "Email intelligence runs only for email inputs.";
    result.timeline = makeTimeline("Email Intel", "Skipped: non-email input.");
    return result;
  }

  const [localPart, domain] = String(input).toLowerCase().split("@");
  log(`Checking local dataset Datasets/domains.json for domain ${domain}`, {
    source: "dataset",
    dataset: "Datasets/domains.json",
  });
  const disposableDomains = await loadDisposableDomains(log);
  const isValidFormat = EMAIL_FORMAT.test(input);
  const isDisposable = disposableDomains.has(domain);
  const provider = COMMON_PROVIDERS[domain] || "Custom / unknown";

  let mxRecords = [];
  try {
    log(`DNS MX lookup for ${domain}`, { source: "dns", type: "MX", domain });
    mxRecords = await dns.resolveMx(domain);
    log(`DNS MX success for ${domain} (${mxRecords.length} record(s))`, {
      source: "dns",
      type: "MX",
      count: mxRecords.length,
      domain,
    });
  } catch {
    mxRecords = [];
    log(`DNS MX failed/no records for ${domain}`, {
      source: "dns",
      type: "MX",
      domain,
    });
  }

  let risk = 0;
  if (!isValidFormat) risk += 10;
  if (isDisposable) risk += 3;
  if (mxRecords.length === 0) risk += 5;

  result.data = {
    email: input,
    localPart,
    domain,
    provider,
    isValidFormat,
    isDisposable,
    mxRecords,
    externalSignals: {},
  };
  result.summary = `Analyzed provider, format, and MX posture for ${input}.`;
  result.riskContribution = risk;
  result.timeline = makeTimeline(
    "Email Intel",
    `Checked MX, provider, and OSINT signals for ${input}.`
  );

  const providerNodeId = `provider:${domain}`;
  result.nodes.push({
    id: providerNodeId,
    label: provider,
    type: "dataset_match",
  });
  result.edges.push(...withRootEdge(rootId, providerNodeId, "registered_on"));

  if (isDisposable) {
    const nodeId = `email:disposable:${domain}`;
    result.nodes.push({
      id: nodeId,
      label: "Disposable email provider",
      type: "pattern_flag",
    });
    result.edges.push(...withRootEdge(rootId, nodeId, "flagged_by"));
  }

  if (mode === "deep") {
    const externalSignals = {
      linkedProfiles: [],
      locationClues: [],
      githubProfiles: [],
    };

    try {
      const hash = crypto.createHash("md5").update(String(input).trim().toLowerCase()).digest("hex");
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
      log(`Checking Gravatar profile signal: ${gravatarUrl}`, {
        source: "website",
        url: gravatarUrl,
      });
      const gravatarRes = await fetchWithTimeout(gravatarUrl, { method: "GET" }, 7000);
      externalSignals.gravatar = {
        exists: gravatarRes.status === 200,
        status: gravatarRes.status,
      };
      if (gravatarRes.status === 200) {
        const nodeId = `email:gravatar:${hash.slice(0, 10)}`;
        result.nodes.push({
          id: nodeId,
          label: "Gravatar profile found",
          type: "platform",
        });
        result.edges.push(...withRootEdge(rootId, nodeId, "active_on"));
      }

      const gravatarJsonUrl = `https://www.gravatar.com/${hash}.json`;
      log(`Checking Gravatar profile JSON: ${gravatarJsonUrl}`, {
        source: "website",
        url: gravatarJsonUrl,
      });
      const gravatarProfileRes = await fetchWithTimeout(gravatarJsonUrl, { method: "GET" }, 7000);
      if (gravatarProfileRes.ok) {
        const data = await gravatarProfileRes.json();
        const entry = data?.entry?.[0] || null;
        if (entry) {
          externalSignals.gravatarProfile = {
            exists: true,
            displayName: entry.displayName || null,
            profileUrl: entry.profileUrl || null,
            currentLocation: entry.currentLocation || null,
            urls: (entry.urls || []).map((item) => item.value).filter(Boolean).slice(0, 6),
          };

          if (entry.profileUrl) {
            externalSignals.linkedProfiles.push({
              source: "gravatar",
              url: entry.profileUrl,
            });
          }
          (entry.urls || []).forEach((item) => {
            if (item?.value) {
              externalSignals.linkedProfiles.push({
                source: "gravatar_url",
                url: item.value,
              });
            }
          });

          pushLocationClue(externalSignals.locationClues, {
            source: "gravatar",
            location: entry.currentLocation,
            confidence: "medium",
            url: entry.profileUrl || null,
          });
        } else {
          externalSignals.gravatarProfile = { exists: false };
        }
      } else {
        externalSignals.gravatarProfile = { exists: false, status: gravatarProfileRes.status };
      }
    } catch (error) {
      externalSignals.gravatar = { exists: false, error: error.message };
      externalSignals.gravatarProfile = { exists: false, error: error.message };
    }

    if (process.env.HIBP_API_KEY) {
      try {
        const hibpUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(input)}?truncateResponse=true`;
        log(`Checking HIBP breach endpoint for email`, {
          source: "website",
          url: "https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
        });
        const hibpRes = await fetchWithTimeout(
          hibpUrl,
          {
            headers: {
              "hibp-api-key": process.env.HIBP_API_KEY,
              "user-agent": "ThreadLine/1.0",
            },
          },
          9000
        );
        if (hibpRes.status === 200) {
          const data = await hibpRes.json();
          externalSignals.hibp = {
            breached: true,
            breachCount: Array.isArray(data) ? data.length : 0,
          };
          risk += 15;
        } else if (hibpRes.status === 404) {
          externalSignals.hibp = { breached: false };
        } else {
          externalSignals.hibp = { breached: null, status: hibpRes.status };
        }
      } catch (error) {
        externalSignals.hibp = { breached: null, error: error.message };
      }
    } else {
      externalSignals.hibp = { skipped: true, reason: "HIBP_API_KEY not set" };
    }

    try {
      const githubSearchByEmailUrl = `https://api.github.com/search/users?q=${encodeURIComponent(input)}+in:email&per_page=5`;
      log(`Checking GitHub public-email search`, {
        source: "website",
        url: "https://api.github.com/search/users?q=<email>+in:email",
      });
      const githubRes = await fetchWithTimeout(
        githubSearchByEmailUrl,
        {
          headers: githubHeaders(),
        },
        8000
      );
      if (githubRes.ok) {
        const data = await githubRes.json();
        const total = Number(data.total_count || 0);
        const items = (data.items || []).slice(0, 5).map((item) => ({
          login: item.login,
          html_url: item.html_url,
        }));
        externalSignals.githubPublicEmail = {
          totalCount: total,
          items,
        };
        if (total > 0) {
          const nodeId = `email:github:${localPart}`;
          result.nodes.push({
            id: nodeId,
            label: `GitHub public-email hit (${total})`,
            type: "platform",
          });
          result.edges.push(...withRootEdge(rootId, nodeId, "active_on"));
          risk += Math.min(8, total * 2);
        }

        const detailedProfiles = await Promise.all(
          items.slice(0, 3).map((item) => fetchGithubUserProfile(item.login, log))
        );
        externalSignals.githubProfiles = detailedProfiles.filter(Boolean);
        externalSignals.githubProfiles.forEach((profile) => {
          if (profile?.html_url) {
            externalSignals.linkedProfiles.push({
              source: "github",
              url: profile.html_url,
            });
          }
          pushLocationClue(externalSignals.locationClues, {
            source: "github",
            location: profile.location,
            confidence: "medium",
            url: profile.html_url,
          });
        });
      } else {
        externalSignals.githubPublicEmail = { totalCount: 0, status: githubRes.status };
      }
    } catch (error) {
      externalSignals.githubPublicEmail = { totalCount: 0, error: error.message };
    }

    try {
      const issuesQuery = encodeURIComponent(`"${input}" in:body`);
      const issueUrl = `https://api.github.com/search/issues?q=${issuesQuery}&per_page=5`;
      log(`Searching public posts for email (GitHub issues/discussions)`, {
        source: "website",
        url: "https://api.github.com/search/issues?q=\"<email>\"+in:body",
      });
      const issuesRes = await fetchWithTimeout(
        issueUrl,
        {
          headers: githubHeaders(),
        },
        8000
      );
      if (issuesRes.ok) {
        const payload = await issuesRes.json();
        externalSignals.githubIssueMentions = {
          totalCount: Number(payload.total_count || 0),
          items: (payload.items || []).slice(0, 5).map((item) => ({
            title: item.title,
            html_url: item.html_url,
            repository_url: item.repository_url,
          })),
        };
      } else {
        externalSignals.githubIssueMentions = {
          totalCount: 0,
          status: issuesRes.status,
        };
      }
    } catch (error) {
      externalSignals.githubIssueMentions = { totalCount: 0, error: error.message };
    }

    try {
      if (localPart.length >= 3) {
        const redditUrl = `https://www.reddit.com/user/${encodeURIComponent(localPart)}/about.json`;
        log(`Checking social profile candidate: ${redditUrl}`, {
          source: "website",
          url: redditUrl,
        });
        const redditRes = await fetchWithTimeout(
          redditUrl,
          {
            headers: {
              "user-agent": "ThreadLine/1.0",
              accept: "application/json",
            },
          },
          8000
        );
        if (redditRes.ok) {
          const payload = await redditRes.json();
          const user = payload?.data || null;
          if (user?.name) {
            const redditProfile = {
              exists: true,
              username: user.name,
              profileUrl: `https://www.reddit.com/user/${encodeURIComponent(user.name)}/`,
              createdUtc: user.created_utc || null,
            };
            externalSignals.reddit = redditProfile;
            externalSignals.linkedProfiles.push({
              source: "reddit",
              url: redditProfile.profileUrl,
            });
            const nodeId = `email:reddit:${user.name.toLowerCase()}`;
            result.nodes.push({
              id: nodeId,
              label: `Reddit candidate profile (${user.name})`,
              type: "platform",
            });
            result.edges.push(...withRootEdge(rootId, nodeId, "active_on"));
          } else {
            externalSignals.reddit = { exists: false };
          }
        } else {
          externalSignals.reddit = { exists: false, status: redditRes.status };
        }
      }
    } catch (error) {
      externalSignals.reddit = { exists: false, error: error.message };
    }

    externalSignals.linkedProfiles = externalSignals.linkedProfiles
      .filter((item) => item?.url)
      .slice(0, 20);

    externalSignals.locationClues.slice(0, 4).forEach((clue, index) => {
      const locationId = clue.location.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 26);
      const nodeId = `email:location:${locationId || index}`;
      result.nodes.push({
        id: nodeId,
        label: `Location clue: ${clue.location}`,
        type: "geolocation",
        meta: clue,
      });
      result.edges.push(...withRootEdge(rootId, nodeId, "possibly_located_in"));
    });

    result.data.externalSignals = externalSignals;
    result.riskContribution = risk;
    result.summary = `Analyzed email provider, breach signals, social profiles, public posts, and location clues for ${input}.`;
  }

  return result;
}
