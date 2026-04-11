#!/usr/bin/env node
/**
 * ThreadLine HIBP Sync Bot
 * 
 * Fetches the latest breach catalog from Have I Been Pwned's public API
 * and rebuilds the local breach intelligence dataset.
 * 
 * Usage:
 *   node scripts/hibp-sync.js           — run once
 *   node scripts/hibp-sync.js --watch   — poll every 6 hours
 * 
 * The HIBP /api/v3/breaches endpoint is publicly accessible (no API key needed)
 * for the breach catalog. Only per-email lookups require a paid key.
 */

const fs = require("fs");
const path = require("path");

const HIBP_API = "https://haveibeenpwned.com/api/v3/breaches";
const DATASET_PATH = path.join(__dirname, "../Datasets/HAVEibeenpawneddataset.JSON");
const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const HEADERS = {
  "User-Agent": "ThreadLine-OSINT-Bot/1.0",
  "Accept": "application/json",
};

function log(msg) {
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  console.log(`[${ts}] ${msg}`);
}

async function fetchBreaches() {
  log("Fetching latest breach catalog from HIBP...");

  const res = await fetch(HIBP_API, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`HIBP API returned ${res.status}: ${res.statusText}`);
  }

  const breaches = await res.json();
  log(`Received ${breaches.length} breaches from HIBP API`);
  return breaches;
}

function loadExisting() {
  try {
    if (fs.existsSync(DATASET_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATASET_PATH, "utf-8"));
      return data;
    }
  } catch (e) {
    log(`Warning: Could not parse existing dataset: ${e.message}`);
  }
  return [];
}

async function sync() {
  try {
    const remote = await fetchBreaches();
    const local = loadExisting();

    const localNames = new Set(local.map((b) => b.Name));
    const newBreaches = remote.filter((b) => !localNames.has(b.Name));

    if (newBreaches.length === 0) {
      log(`Dataset is up to date (${local.length} breaches). No changes.`);
      return false;
    }

    log(`Found ${newBreaches.length} new breaches:`);
    newBreaches.forEach((b) => {
      log(`  + ${b.Name} (${b.BreachDate}) — ${(b.PwnCount || 0).toLocaleString()} accounts`);
    });

    // Write updated dataset
    fs.writeFileSync(DATASET_PATH, JSON.stringify(remote, null, 2));
    log(`Updated dataset: ${DATASET_PATH} (${remote.length} total breaches)`);

    // Rebuild derived data files
    log("Rebuilding breach intelligence data...");
    const { execSync } = require("child_process");
    execSync("node scripts/build-breach-data.js", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });

    log(`Sync complete. Added ${newBreaches.length} new breaches.`);
    return true;
  } catch (err) {
    log(`ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  const watchMode = process.argv.includes("--watch");

  log("ThreadLine HIBP Sync Bot starting...");
  log(`Dataset path: ${DATASET_PATH}`);
  log(`Mode: ${watchMode ? `Watch (polling every ${POLL_INTERVAL_MS / 3600000}h)` : "One-shot"}`);

  await sync();

  if (watchMode) {
    log(`Next sync in ${POLL_INTERVAL_MS / 3600000} hours. Press Ctrl+C to stop.`);
    setInterval(async () => {
      log("--- Scheduled sync ---");
      await sync();
      log(`Next sync in ${POLL_INTERVAL_MS / 3600000} hours.`);
    }, POLL_INTERVAL_MS);
  }
}

main();
