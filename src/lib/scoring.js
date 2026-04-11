function labelForScore(score) {
  if (score <= 30) return "Low Risk";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "High Risk";
  return "Critical";
}

export function calculateThreatScore({ mode, moduleResults }) {
  const breakdown = [];
  let total = 0;

  for (const result of moduleResults) {
    const contribution = Math.max(0, Number(result?.riskContribution || 0));
    if (contribution <= 0) continue;

    breakdown.push({
      module: result.module,
      points: contribution,
      reason: result.summary || "Risk signals detected",
    });
    total += contribution;
  }

  if (mode === "deep") {
    total += 5;
    breakdown.push({
      module: "deep_mode_context",
      points: 5,
      reason: "Live OSINT enrichments enabled",
    });
  }

  const score = Math.min(100, total);
  return {
    score,
    label: labelForScore(score),
    breakdown,
  };
}

