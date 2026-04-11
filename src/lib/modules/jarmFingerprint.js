import { baseResult, makeTimeline } from "./utils";

export async function run(input, inputType, options = {}) {
  const result = baseResult("jarmFingerprint", "deep");

  if (inputType !== "ip" && inputType !== "domain") {
    result.status = "partial";
    result.summary = "JARM fingerprinting requires IP or domain input.";
    result.timeline = makeTimeline("JARM Fingerprint", "Skipped: unsupported input type.");
    return result;
  }

  result.status = "partial";
  result.summary =
    "JARM active fingerprinting scaffold is available but disabled by default for safe demos.";
  result.timeline = makeTimeline(
    "JARM Fingerprint",
    "Module loaded as deep-mode extension point."
  );
  return result;
}

