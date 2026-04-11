import GlassCard from "../ui/GlassCard";
import NotFoundPage from "../ui/page-not-found";

const TAG_COLORS = {
  "Account Signal": "var(--accent-violet)",
  Subdomain: "var(--accent-ice)",
  "Open Port": "var(--accent-ember)",
  "Phishing Feed": "var(--accent-warn)",
  "Location Clue": "var(--accent-signal)",
  "Public Posts": "var(--accent-ice)",
  "Breach Signal": "var(--accent-ember)",
};

function normalizeFindings(moduleMap) {
  const cards = [];

  const usernameProfiles = moduleMap.usernameEnum?.data?.discoveredProfiles || [];
  usernameProfiles.slice(0, 12).forEach((profile, index) => {
    cards.push({
      id: `profile-${index}`,
      tag: "Account Signal",
      title: `${profile.platform} (${profile.username})`,
      subtitle: profile.url,
    });
  });

  const subdomains = moduleMap.subdomain?.data?.discovered || [];
  subdomains.slice(0, 8).forEach((host, index) => {
    cards.push({
      id: `subdomain-${index}`,
      tag: "Subdomain",
      title: host,
      subtitle: "From certificate transparency logs",
    });
  });

  const openPorts = moduleMap.shodanInternetDB?.data?.ports || [];
  openPorts.slice(0, 8).forEach((port, index) => {
    cards.push({
      id: `port-${index}`,
      tag: "Open Port",
      title: `Port ${port}`,
      subtitle: "Shodan InternetDB",
    });
  });

  const phishHits =
    moduleMap.datasetMatch?.data?.findings?.find((item) => item.source === "phishtank_csv")
      ?.records || [];
  phishHits.slice(0, 5).forEach((hit, index) => {
    cards.push({
      id: `phishtank-${index}`,
      tag: "Phishing Feed",
      title: hit.target || "PhishTank entry",
      subtitle: hit.url,
    });
  });

  const emailSignals = moduleMap.emailIntel?.data?.externalSignals || {};
  const githubProfiles = emailSignals.githubProfiles || [];
  githubProfiles.slice(0, 4).forEach((profile, index) => {
    cards.push({
      id: `email-gh-${index}`,
      tag: "Account Signal",
      title: `GitHub: ${profile.login}`,
      subtitle: profile.html_url || "Public profile",
    });
  });

  const locationClues = emailSignals.locationClues || [];
  locationClues.slice(0, 4).forEach((clue, index) => {
    cards.push({
      id: `loc-${index}`,
      tag: "Location Clue",
      title: clue.location || "Potential location",
      subtitle: `${clue.source} - ${clue.confidence || "low"} confidence`,
    });
  });

  const posts = emailSignals.githubIssueMentions?.items || [];
  posts.slice(0, 4).forEach((post, index) => {
    cards.push({
      id: `post-${index}`,
      tag: "Public Posts",
      title: post.title || "Public mention",
      subtitle: post.html_url || post.repository_url || "GitHub",
    });
  });

  if (emailSignals.hibp?.breached) {
    cards.push({
      id: "hibp-breach",
      tag: "Breach Signal",
      title: `HIBP breached account (${emailSignals.hibp.breachCount || 0})`,
      subtitle: "Have I Been Pwned API",
    });
  }

  return cards;
}

export default function FindingsPanel({ moduleMap }) {
  const cards = normalizeFindings(moduleMap);

  return (
    <GlassCard style={{ padding: "14px" }}>
      <p className="type-label" style={{ marginBottom: "10px" }}>
        Findings ({cards.length})
      </p>
      {cards.length === 0 ? (
        <div style={{ height: "220px", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          <NotFoundPage
            title="No Findings Yet"
            code="0"
            description="No public intelligence entries matched this query right now."
            fullscreen={false}
            hideActions
            showDecorations={false}
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          {cards.map((card) => {
            const tagColor = TAG_COLORS[card.tag] || "var(--accent-ice)";
            return (
              <div
                key={card.id}
                style={{
                  border: `1px solid color-mix(in srgb, ${tagColor} 32%, transparent)`,
                  borderRadius: "var(--radius-sm)",
                  padding: "10px",
                  background: `linear-gradient(180deg, color-mix(in srgb, ${tagColor} 8%, transparent), rgba(255,255,255,0.01))`,
                }}
              >
                <p
                  className="type-caption"
                  style={{ color: tagColor, marginBottom: "4px", letterSpacing: "0.08em" }}
                >
                  {card.tag}
                </p>
                <p style={{ fontSize: "0.86rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {card.title}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    wordBreak: "break-all",
                  }}
                >
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
