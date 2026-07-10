const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const DOMAIN_REGEX =
  /^(?!:\/\/)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

export function normalizeInput(input) {
  return String(input || "").trim().toLowerCase();
}

export function detectInputType(rawInput) {
  const input = normalizeInput(rawInput);

  if (!input) {
    return "unknown";
  }

  if (EMAIL_REGEX.test(input)) {
    return "email";
  }

  if (IPV4_REGEX.test(input)) {
    return "ip";
  }

  if (DOMAIN_REGEX.test(input)) {
    return "domain";
  }

  return "username";
}

export function getModules(inputType, mode = "standard") {
  const standard = {
    domain: ["dns", "techFingerprint", "patternAnalysis", "datasetMatch"],
    email: ["emailIntel", "dns", "techFingerprint", "patternAnalysis", "datasetMatch"],
    username: ["usernameEnum", "patternAnalysis", "datasetMatch"],
    ip: ["localIpLookup", "reverseDns", "patternAnalysis", "datasetMatch"],
  };

  const deep = {
    domain: [
      "subdomain",
      "whois",
      "sslExtraction",
      "dns",
      "techFingerprint",
      "ipGeoApi",
      "asnLookup",
      "shodanInternetDB",
      "openphish",
      "patternAnalysis",
      "datasetMatch",
      "alienvaultOtx",
    ],
    email: [
      "emailIntel",
      "usernameEnum",
      "whois",
      "dns",
      "techFingerprint",
      "sslExtraction",
      "subdomain",
      "ipGeoApi",
      "asnLookup",
      "shodanInternetDB",
      "openphish",
      "patternAnalysis",
      "datasetMatch",
      "githubCommitSearch",
      "keybaseLookup",
    ],
    username: ["usernameEnum", "patternAnalysis", "datasetMatch", "keybaseLookup"],
    ip: [
      "ipGeoApi",
      "asnLookup",
      "shodanInternetDB",
      "localIpLookup",
      "reverseDns",
      "patternAnalysis",
      "datasetMatch",
      "alienvaultOtx",
    ],
  };

  const selected = mode === "deep" ? deep : standard;
  return selected[inputType] || [];
}
