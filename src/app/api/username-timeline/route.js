import { NextResponse } from "next/server";

const TIMEOUT_MS = 5000;

async function fetchTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── Relative time helper ─────────────────────────────────────────────
function relTime(dateStr) {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

function ageLabel(dateStr) {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  const years = new Date().getFullYear() - year;
  const months = new Date().getMonth() - new Date(dateStr).getMonth() +
    (new Date().getFullYear() - new Date(dateStr).getFullYear()) * 12;
  if (years >= 1) return `${years} year${years > 1 ? "s" : ""} old`;
  return `${months} month${months !== 1 ? "s" : ""} old`;
}

// ─── PLATFORM 1: GitHub ───────────────────────────────────────────────
async function fetchGitHub(username) {
  const platform = "GitHub";
  try {
    const [profileRes, eventsRes] = await Promise.all([
      fetchTimeout(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: { "User-Agent": "ThreadLine/1.0", Accept: "application/vnd.github+json" },
      }),
      fetchTimeout(`https://api.github.com/users/${encodeURIComponent(username)}/events/public`, {
        headers: { "User-Agent": "ThreadLine/1.0", Accept: "application/vnd.github+json" },
      }),
    ]);

    if (profileRes.status === 404) return { platform, status: "not_found" };
    if (!profileRes.ok) return { platform, status: "error", code: profileRes.status };

    const profile = await profileRes.json();
    const meta = {
      username: profile.login,
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      blog: profile.blog,
      followers: profile.followers,
      following: profile.following,
      public_repos: profile.public_repos,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      account_age: ageLabel(profile.created_at),
      url: profile.html_url,
    };

    const timeline = [];
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      for (const evt of (Array.isArray(events) ? events : []).slice(0, 20)) {
        let action = "";
        switch (evt.type) {
          case "PushEvent":
            action = `Pushed ${evt.payload?.commits?.length || 1} commit(s) to ${evt.repo?.name}`;
            break;
          case "CreateEvent":
            action = `Created ${evt.payload?.ref_type || "repository"}: ${evt.repo?.name}`;
            break;
          case "WatchEvent":
            action = `Starred repository ${evt.repo?.name}`;
            break;
          case "ForkEvent":
            action = `Forked ${evt.repo?.name}`;
            break;
          case "IssuesEvent":
            action = `${evt.payload?.action} issue in ${evt.repo?.name}`;
            break;
          case "PullRequestEvent":
            action = `${evt.payload?.action} PR in ${evt.repo?.name}`;
            break;
          default:
            action = `${evt.type} on ${evt.repo?.name}`;
        }
        timeline.push({
          platform,
          timestamp: evt.created_at,
          relative: relTime(evt.created_at),
          action,
          icon: "git-commit",
        });
      }
    }

    return { platform, status: "found", meta, timeline };
  } catch {
    return { platform, status: "timeout_or_error" };
  }
}

// ─── PLATFORM 2: Reddit ───────────────────────────────────────────────
async function fetchReddit(username) {
  const platform = "Reddit";
  const headers = { "User-Agent": "ThreadLine/1.0", Accept: "application/json" };
  try {
    const aboutRes = await fetchTimeout(
      `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`,
      { headers }
    );

    if (!aboutRes.ok) {
      if (aboutRes.status === 404) return { platform, status: "not_found" };
      return { platform, status: "error", code: aboutRes.status };
    }

    const aboutData = await aboutRes.json();
    const u = aboutData?.data;
    if (!u?.name) return { platform, status: "not_found" };

    const meta = {
      username: u.name,
      comment_karma: u.comment_karma,
      link_karma: u.link_karma,
      total_karma: (u.comment_karma || 0) + (u.link_karma || 0),
      created_at: new Date(u.created_utc * 1000).toISOString(),
      account_age: ageLabel(new Date(u.created_utc * 1000)),
      is_gold: u.is_gold,
      verified: u.verified,
      url: `https://www.reddit.com/user/${u.name}/`,
    };

    // Fetch recent posts
    const timeline = [];
    try {
      const submittedRes = await fetchTimeout(
        `https://www.reddit.com/user/${encodeURIComponent(username)}/submitted.json?limit=10`,
        { headers }
      );
      if (submittedRes.ok) {
        const submittedData = await submittedRes.json();
        const posts = submittedData?.data?.children || [];
        for (const child of posts) {
          const p = child.data;
          timeline.push({
            platform,
            timestamp: new Date(p.created_utc * 1000).toISOString(),
            relative: relTime(new Date(p.created_utc * 1000).toISOString()),
            action: `Posted "${p.title}" in r/${p.subreddit}`,
            icon: "message-square",
            url: `https://reddit.com${p.permalink}`,
          });
        }
      }
    } catch { /* graceful degradation */ }

    return { platform, status: "found", meta, timeline };
  } catch {
    return { platform, status: "timeout_or_error" };
  }
}

// ─── PLATFORM 3: HackerNews ───────────────────────────────────────────
async function fetchHackerNews(username) {
  const platform = "HackerNews";
  try {
    const res = await fetchTimeout(
      `https://hn.algolia.com/api/v1/search?tags=author_${encodeURIComponent(username)}&hitsPerPage=15`
    );
    if (!res.ok) return { platform, status: "error", code: res.status };
    const data = await res.json();
    const hits = data?.hits || [];

    if (hits.length === 0) return { platform, status: "not_found" };

    const meta = {
      username,
      totalItems: data.nbHits || hits.length,
      firstSeen: hits.length > 0 ? hits[hits.length - 1]?.created_at : null,
      url: `https://news.ycombinator.com/user?id=${username}`,
    };

    const timeline = hits.slice(0, 10).map((h) => ({
      platform,
      timestamp: h.created_at,
      relative: relTime(h.created_at),
      action: h.story_title
        ? `Commented on "${h.story_title.slice(0, 60)}"`
        : `Submitted "${(h.title || "item").slice(0, 60)}"`,
      icon: "zap",
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));

    return { platform, status: "found", meta, timeline };
  } catch {
    return { platform, status: "timeout_or_error" };
  }
}

// ─── PLATFORM 4: GitLab ───────────────────────────────────────────────
async function fetchGitLab(username) {
  const platform = "GitLab";
  try {
    const searchRes = await fetchTimeout(
      `https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`
    );
    if (!searchRes.ok) return { platform, status: "error", code: searchRes.status };
    const users = await searchRes.json();
    if (!Array.isArray(users) || users.length === 0) return { platform, status: "not_found" };

    const user = users[0];
    const meta = {
      username: user.username,
      name: user.name,
      bio: user.bio,
      location: user.location,
      created_at: user.created_at,
      account_age: ageLabel(user.created_at),
      public_repos: user.public_repos,
      url: user.web_url,
    };

    // Fetch events
    const timeline = [];
    try {
      const eventsRes = await fetchTimeout(
        `https://gitlab.com/api/v4/users/${user.id}/events?per_page=10`
      );
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        for (const evt of (Array.isArray(events) ? events : []).slice(0, 10)) {
          timeline.push({
            platform,
            timestamp: evt.created_at,
            relative: relTime(evt.created_at),
            action: `${evt.action_name || "Action"}: ${evt.target_title || evt.project_id || ""}`,
            icon: "git-branch",
          });
        }
      }
    } catch { /* graceful degradation */ }

    return { platform, status: "found", meta, timeline };
  } catch {
    return { platform, status: "timeout_or_error" };
  }
}

// ─── PLATFORM 5: Keybase ─────────────────────────────────────────────
async function fetchKeybase(username) {
  const platform = "Keybase";
  try {
    const res = await fetchTimeout(
      `https://keybase.io/_/api/1.0/user/lookup.json?username=${encodeURIComponent(username)}`
    );
    if (!res.ok) return { platform, status: "error", code: res.status };
    const data = await res.json();

    if (data.status?.name !== "OK" || !data.them) return { platform, status: "not_found" };

    const u = data.them;
    const proofs = [];

    // Extract cryptographic identity proofs
    for (const [service, proof] of Object.entries(u.proofs_summary?.by_presentation_group || {})) {
      for (const p of proof) {
        proofs.push({
          service,
          username: p.nametag,
          verified: p.state === 1,
          url: p.proof_url,
        });
      }
    }

    const meta = {
      username: u.basics?.username,
      fullName: u.profile?.full_name,
      bio: u.profile?.bio,
      location: u.profile?.location,
      created_at: u.basics?.ctime ? new Date(u.basics.ctime * 1000).toISOString() : null,
      account_age: u.basics?.ctime ? ageLabel(new Date(u.basics.ctime * 1000)) : null,
      pgp_keys: (u.public_keys?.pgp_public_keys || []).length,
      verifiedProofs: proofs.filter((p) => p.verified).length,
      proofs,
      url: `https://keybase.io/${username}`,
    };

    const timeline = proofs.map((p) => ({
      platform,
      timestamp: null,
      relative: "Verified",
      action: `Cryptographically linked to ${p.service}: @${p.username}`,
      icon: "shield",
      verified: p.verified,
      url: p.url,
    }));

    return { platform, status: "found", meta, timeline };
  } catch {
    return { platform, status: "timeout_or_error" };
  }
}

// ─── API ROUTE ────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = String(searchParams.get("username") || "").trim();

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "username param required" }, { status: 400 });
  }

  const [github, reddit, hn, gitlab, keybase] = await Promise.allSettled([
    fetchGitHub(username),
    fetchReddit(username),
    fetchHackerNews(username),
    fetchGitLab(username),
    fetchKeybase(username),
  ]);

  const platforms = [
    github.status === "fulfilled" ? github.value : { platform: "GitHub", status: "error" },
    reddit.status === "fulfilled" ? reddit.value : { platform: "Reddit", status: "error" },
    hn.status === "fulfilled" ? hn.value : { platform: "HackerNews", status: "error" },
    gitlab.status === "fulfilled" ? gitlab.value : { platform: "GitLab", status: "error" },
    keybase.status === "fulfilled" ? keybase.value : { platform: "Keybase", status: "error" },
  ];

  // Merge all timelines, sort newest first
  const allTimeline = platforms
    .flatMap((p) => (p.timeline || []))
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const foundPlatforms = platforms.filter((p) => p.status === "found");

  return NextResponse.json({
    username,
    platforms,
    timeline: allTimeline.slice(0, 50),
    summary: {
      found: foundPlatforms.length,
      total: platforms.length,
      foundOn: foundPlatforms.map((p) => p.platform),
    },
  });
}
