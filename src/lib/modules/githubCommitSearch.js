import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  timeoutSignal,
  withRootEdge,
} from "./utils";

function githubHeaders() {
  return {
    "user-agent": "ThreadLine/1.0",
    accept: "application/vnd.github.cloak-preview+json", // Specific header for commit search API
    ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

export async function run(input, inputType, options = {}) {
  const result = baseResult("githubCommitSearch", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  if (inputType !== "email") {
    result.status = "partial";
    result.summary = "GitHub commit search is only for email-based inputs.";
    result.timeline = makeTimeline("GitHub Commit Search", "Skipped: non-email input.");
    return result;
  }

  const { signal, cleanup } = timeoutSignal(9000);
  try {
    const query = encodeURIComponent(`author-email:${input}`);
    const githubApiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
    const url = `${githubApiUrl}/search/commits?q=${query}&per_page=15`;
    log(`Querying GitHub Commit Search API: ${url}`, { source: "website", url });

    const response = await fetch(url, {
      headers: githubHeaders(),
      signal,
    });
    cleanup();

    if (!response.ok) {
      // If unauthorized or rate limited, return partial/error but don't crash
      result.status = "partial";
      result.summary = `GitHub API returned status ${response.status}. Commit search skipped.`;
      log(`GitHub Commit Search failed with status: ${response.status}`, {
        source: "website",
        status: response.status,
      });
      return result;
    }

    const payload = await response.json();
    const totalCount = payload.total_count || 0;
    const items = payload.items || [];

    const repositories = [];
    const profiles = [];
    const names = new Set();

    items.forEach((item) => {
      if (item.author) {
        profiles.push({
          login: item.author.login,
          html_url: item.author.html_url,
          avatar_url: item.author.avatar_url,
        });
      }
      if (item.repository) {
        repositories.push({
          name: item.repository.name,
          full_name: item.repository.full_name,
          html_url: item.repository.html_url,
          description: item.repository.description,
        });
      }
      if (item.commit?.author?.name) {
        names.add(item.commit.author.name);
      }
    });

    // Deduplicate profiles and repositories
    const uniqueProfiles = Array.from(new Map(profiles.map(p => [p.login, p])).values());
    const uniqueRepos = Array.from(new Map(repositories.map(r => [r.full_name, r])).values());

    result.data = {
      totalCount,
      realNames: Array.from(names),
      profiles: uniqueProfiles,
      repositories: uniqueRepos.slice(0, 10),
    };

    log(`GitHub Commit Search found ${totalCount} commits for ${input}.`, {
      source: "website",
      url,
      commitsCount: totalCount,
    });

    if (totalCount === 0) {
      result.status = "success";
      result.summary = "No public commits found linked to this email address.";
      result.timeline = makeTimeline("GitHub Commit Search", "No public commits discovered.");
      return result;
    }

    result.summary = `Linked email to ${uniqueProfiles.length} GitHub profile(s) and found ${totalCount} public commits.`;
    result.riskContribution = Math.min(10, uniqueProfiles.length * 5);
    result.timeline = makeTimeline(
      "GitHub Commit Search",
      `Correlated email with public commit author logs on GitHub.`
    );

    // 1. Add GitHub Profile Nodes
    uniqueProfiles.forEach((profile) => {
      const profileNodeId = `github:profile:${profile.login.toLowerCase()}`;
      result.nodes.push({
        id: profileNodeId,
        label: `GitHub: @${profile.login}`,
        type: "platform",
        meta: {
          url: profile.html_url,
        },
      });
      result.edges.push(...withRootEdge(rootId, profileNodeId, "active_on"));

      // 2. Link Repositories to their respective profiles
      uniqueRepos.slice(0, 5).forEach((repo) => {
        const repoNodeId = `github:repo:${repo.full_name.toLowerCase()}`;
        result.nodes.push({
          id: repoNodeId,
          label: `Repo: ${repo.full_name}`,
          type: "platform",
          meta: {
            url: repo.html_url,
          },
        });
        result.edges.push({
          source: profileNodeId,
          target: repoNodeId,
          rel: "contributed_to",
        });
      });
    });

    // 3. Add Real Name node if found
    names.forEach((name) => {
      const nameNodeId = `identity:name:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      result.nodes.push({
        id: nameNodeId,
        label: `Real Name Clue: ${name}`,
        type: "pattern_flag",
      });
      result.edges.push(...withRootEdge(rootId, nameNodeId, "possibly_named"));
    });

    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `GitHub commit search failed: ${error.message}`;
    return result;
  }
}
