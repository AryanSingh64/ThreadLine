import {
  attachDebugLogger,
  baseResult,
  makeTimeline,
  timeoutSignal,
  withRootEdge,
} from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("keybaseLookup", "deep");
  const log = attachDebugLogger(result, options);
  const rootId = options.rootNodeId || `input:${input}`;

  const username =
    inputType === "email" ? String(input).split("@")[0].toLowerCase() : String(input).toLowerCase();

  if (!username) {
    result.status = "partial";
    result.summary = "Keybase lookup requires a username-based target.";
    result.timeline = makeTimeline("Keybase Lookup", "Skipped: no candidate username.");
    return result;
  }

  const { signal, cleanup } = timeoutSignal(9000);
  try {
    const baseUrl = process.env.KEYBASE_API_URL || "https://keybase.io/_/api/1.0/user/lookup.json";
    const url = `${baseUrl}?usernames=${encodeURIComponent(username)}`;
    log(`Querying Keybase Lookup API: ${url}`, { source: "website", url });
    const response = await fetch(url, { signal });
    cleanup();

    if (!response.ok) {
      result.status = "error";
      result.summary = `Keybase API returned status ${response.status}.`;
      return result;
    }

    const payload = await response.json();
    if (payload.status?.code !== 0) {
      result.status = "error";
      result.summary = `Keybase API error: ${payload.status?.desc || "unknown"}`;
      return result;
    }

    const userData = payload.them?.[0];
    if (!userData) {
      result.status = "partial";
      result.summary = "No Keybase profile found for this username.";
      result.timeline = makeTimeline("Keybase Lookup", "No matching profile.");
      return result;
    }

    const basics = userData.basics || {};
    const profile = userData.profile || {};
    const publicKeys = userData.public_keys || {};
    const proofs = userData.proofs_summary?.all || [];

    result.data = {
      username: basics.username,
      fullName: profile.full_name,
      location: profile.location,
      bio: profile.bio,
      hasPgp: !!publicKeys.primary,
      pgpFingerprint: publicKeys.primary?.fingerprint,
      proofs: proofs.map((p) => ({
        type: p.proof_type,
        nametag: p.nametag,
        url: p.service_url || p.proof_url,
      })),
    };

    log(`Keybase profile found for ${basics.username} with ${proofs.length} verified proof(s).`, {
      source: "website",
      url,
      proofsCount: proofs.length,
    });

    result.summary = `Discovered Keybase account (${basics.username}) with ${proofs.length} verified social proof(s).`;
    result.timeline = makeTimeline(
      "Keybase Lookup",
      `Retrieved identity verification summary for ${basics.username}.`
    );

    // 1. Add Keybase Profile Node
    const keybaseNodeId = `keybase:profile:${basics.username}`;
    result.nodes.push({
      id: keybaseNodeId,
      label: `Keybase: ${basics.username}`,
      type: "platform",
    });
    result.edges.push(...withRootEdge(rootId, keybaseNodeId, "active_on"));

    // 2. Add verified social nodes
    proofs.forEach((proof) => {
      const type = proof.proof_type || "generic";
      const nametag = proof.nametag || "";
      const nodeId = `keybase:proof:${type}:${nametag.toLowerCase()}`;
      
      result.nodes.push({
        id: nodeId,
        label: `Verified ${type.toUpperCase()}: ${nametag}`,
        type: "platform",
        meta: {
          url: proof.service_url || proof.proof_url,
        },
      });
      result.edges.push(...withRootEdge(keybaseNodeId, nodeId, "proves_identity"));
    });

    // 3. Add PGP Key node if present
    if (publicKeys.primary?.fingerprint) {
      const pgpNodeId = `keybase:pgp:${publicKeys.primary.key_id || "key"}`;
      result.nodes.push({
        id: pgpNodeId,
        label: `PGP Fingerprint: ${publicKeys.primary.fingerprint.slice(-8).toUpperCase()}`,
        type: "pattern_flag",
        meta: {
          fingerprint: publicKeys.primary.fingerprint,
        },
      });
      result.edges.push(...withRootEdge(keybaseNodeId, pgpNodeId, "owns_key"));
    }

    // 4. Add location node if present
    if (profile.location) {
      const locId = profile.location.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const locNodeId = `keybase:location:${locId}`;
      result.nodes.push({
        id: locNodeId,
        label: `Location clue: ${profile.location}`,
        type: "geolocation",
      });
      result.edges.push(...withRootEdge(keybaseNodeId, locNodeId, "possibly_located_in"));
    }

    return result;
  } catch (error) {
    cleanup();
    result.status = "error";
    result.summary = `Keybase request failed: ${error.message}`;
    return result;
  }
}
