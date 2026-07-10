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
  "Threat Indicator": "var(--accent-warn)",
  "IP Resolution": "var(--accent-ice)",
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

  // 1. Keybase Lookup
  const keybaseProofs = moduleMap.keybaseLookup?.data?.proofs || [];
  keybaseProofs.forEach((proof) => {
    cards.push({
      id: `keybase-${proof.type}-${proof.nametag}`,
      tag: "Account Signal",
      title: `Keybase verified ${proof.type.toUpperCase()}: @${proof.nametag}`,
      subtitle: proof.url || "Verified profile link",
    });
  });

  const keybaseLocation = moduleMap.keybaseLookup?.data?.location;
  if (keybaseLocation) {
    cards.push({
      id: "keybase-loc",
      tag: "Location Clue",
      title: keybaseLocation,
      subtitle: "Verified location on Keybase profile",
    });
  }

  // 2. GitHub Commit Search
  const githubCommits = moduleMap.githubCommitSearch?.data || {};
  const githubCommitProfiles = githubCommits.profiles || [];
  githubCommitProfiles.forEach((profile) => {
    cards.push({
      id: `gh-commit-profile-${profile.login}`,
      tag: "Account Signal",
      title: `GitHub Commit Author: @${profile.login}`,
      subtitle: profile.html_url || "Public profile link",
    });
  });

  if (githubCommits.totalCount > 0) {
    cards.push({
      id: "gh-commit-count",
      tag: "Public Posts",
      title: `GitHub: ${githubCommits.totalCount} commit logs`,
      subtitle: `Email associated with public code commits`,
    });
  }

  const githubRealNames = githubCommits.realNames || [];
  githubRealNames.forEach((name) => {
    cards.push({
      id: `gh-realname-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      tag: "Account Signal",
      title: `Real Name Clue: ${name}`,
      subtitle: "Extracted from public code commit signatures",
    });
  });

  // 3. AlienVault OTX
  const otxData = moduleMap.alienvaultOtx?.data || {};
  const otxResolutions = otxData.resolutions || [];
  otxResolutions.forEach((res, index) => {
    cards.push({
      id: `otx-res-${index}`,
      tag: "IP Resolution",
      title: `Historical IP: ${res.address}`,
      subtitle: `OTX Passive DNS (ASN: ${res.asn || "unknown"})`,
    });
  });

  const otxPulses = otxData.pulses || [];
  otxPulses.forEach((pulse) => {
    cards.push({
      id: `otx-pulse-${pulse.id}`,
      tag: "Threat Indicator",
      title: `Threat Pulse: ${pulse.name}`,
      subtitle: `OTX Reputation Check - Adversary: ${pulse.adversary}`,
    });
  });

  // 4. Local HIBP Breach Metadata Matches
  const localHibpBreaches = moduleMap.datasetMatch?.data?.findings?.find(
    (item) => item.source === "local_hibp_breach_metadata"
  )?.records || [];
  localHibpBreaches.forEach((breach) => {
    cards.push({
      id: `local-hibp-${breach.name}`,
      tag: "Breach Signal",
      title: `${breach.title} data breach`,
      subtitle: `Leaked on ${breach.breachDate} (${Number(breach.pwnCount).toLocaleString()} records pwned)`,
    });
  });

  // 5. CISA Known Exploited Vulnerabilities from Shodan
  const cisaExploits = moduleMap.shodanInternetDB?.data?.exploitedVulns || [];
  cisaExploits.forEach((ev) => {
    cards.push({
      id: `cisa-cve-${ev.cveID}`,
      tag: "Threat Indicator",
      title: `Wild Active Exploit: ${ev.cveID}`,
      subtitle: `CISA KEV - Product: ${ev.vendorProject} ${ev.product}`,
    });
  });

  // 6. Pattern Analysis
  const patternFlags = moduleMap.patternAnalysis?.data?.flags || [];
  patternFlags.forEach((flag, index) => {
    cards.push({
      id: `pattern-flag-${index}`,
      tag: "Threat Indicator",
      title: flag,
      subtitle: "Heuristic pattern analysis check",
    });
  });

  // 7. SSL Certificate Details
  const sslData = moduleMap.sslExtraction?.data;
  if (sslData) {
    cards.push({
      id: "ssl-info",
      tag: "Subdomain",
      title: `SSL Issued by: ${sslData.issuer}`,
      subtitle: `Certificate age: ${sslData.ageInDays} day(s) (Subject: ${sslData.subject})`,
    });
  }

  // 8. Tech Fingerprinting Server
  const techData = moduleMap.techFingerprint?.data;
  if (techData && techData.server) {
    cards.push({
      id: "tech-server",
      tag: "Public Posts",
      title: `Web Server: ${techData.server}`,
      subtitle: `Resolved via ${techData.urlUsed} (Status: ${techData.status})`,
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
