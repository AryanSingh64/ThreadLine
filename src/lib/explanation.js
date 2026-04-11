function moduleText(name) {
  const map = {
    dns:             "DNS reconnaissance",
    techFingerprint: "technology fingerprinting",
    usernameEnum:    "username surface enumeration",
    emailIntel:      "email intelligence checks",
    patternAnalysis: "pattern-based anomaly detection",
    datasetMatch:    "local threat dataset matching",
    localIpLookup:   "offline IP intelligence",
    reverseDns:      "reverse DNS validation",
    sslExtraction:   "TLS certificate extraction",
    subdomain:       "certificate transparency subdomain discovery",
    whois:           "WHOIS enrichment",
    ipGeoApi:        "live IP geolocation",
    asnLookup:       "ASN and hosting ownership checks",
    shodanInternetDB:"exposure analysis from Shodan InternetDB",
    openphish:       "active phishing feed checks",
  };
  return map[name] || name;
}

export function generateExplanation({ input, inputType, mode, score, label, moduleResults }) {
  const successful = moduleResults.filter(
    (m) => m?.status === "success" || m?.status === "partial"
  );
  const heavyRisk = moduleResults
    .filter((m) => Number(m?.riskContribution || 0) >= 10)
    .slice(0, 3)
    .map((m) => moduleText(m.module));

  const moduleSummary = successful
    .slice(0, 4)
    .map((m) => moduleText(m.module))
    .join(", ");

  const highRiskText = heavyRisk.length > 0
    ? `Primary risk pressure came from ${heavyRisk.join(", ")}.`
    : "No single dominant high-severity signal was detected.";

  // Pull interesting signals from module data
  const extras = [];

  const usernameModule = moduleResults.find((m) => m.module === "usernameEnum");
  if (usernameModule?.data?.discoveredProfiles?.length > 0) {
    const count = usernameModule.data.discoveredProfiles.length;
    const platforms = usernameModule.data.discoveredProfiles.slice(0, 3).map((p) => p.platform).join(", ");
    extras.push(`The identity was found on ${count} platform(s) including ${platforms}.`);
  }

  const emailModule = moduleResults.find((m) => m.module === "emailIntel");
  if (emailModule?.data?.isDisposable) {
    extras.push("The email domain was identified as a disposable/temporary provider — a strong indicator of anonymization intent.");
  }

  const subdomainModule = moduleResults.find((m) => m.module === "subdomain");
  const criticalSubs = (subdomainModule?.data?.advanced || []).filter((s) => s.active).length;
  if (criticalSubs > 0) {
    extras.push(`${criticalSubs} active subdomain(s) were resolved from certificate transparency logs.`);
  }

  const shodanModule = moduleResults.find((m) => m.module === "shodanInternetDB");
  if ((shodanModule?.data?.ports || []).length > 0) {
    extras.push(`Shodan detected ${shodanModule.data.ports.length} exposed port(s) on the associated IP.`);
  }

  const whoisModule = moduleResults.find((m) => m.module === "whois");
  if (whoisModule?.data?.domainAge?.days < 90) {
    extras.push("The domain was registered fewer than 90 days ago — a common indicator of disposable threat infrastructure.");
  }

  const extrasText = extras.length > 0 ? ` ${extras.join(" ")}` : "";

  return `ThreadLine investigated the ${inputType} input "${input}" in ${mode} mode across ${successful.length} intelligence module(s), including ${moduleSummary || "core analysis modules"}.${extrasText} ${highRiskText} Combined evidence produced a threat score of ${score}/100, classified as ${label}.`;
}
