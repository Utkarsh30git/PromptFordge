// Centralized configuration for Prompt Quality Analysis.
//
// The AI model only ever supplies the five individual dimension
// scores — the overall score is always computed HERE, deterministically,
// from a single weights object. This keeps scoring auditable and
// avoids the model's own "overall" number (which it isn't asked for)
// drifting from what the UI actually displays.
//
// To adjust dimension weights later: edit QUALITY_WEIGHTS only.
// Nothing else in the analyze flow needs to change.

export const QUALITY_DIMENSIONS = [
  "clarity",
  "specificity",
  "context",
  "structure",
  "outputDefinition",
];

export const QUALITY_WEIGHTS = {
  clarity: 0.2,
  specificity: 0.25,
  context: 0.2,
  structure: 0.15,
  outputDefinition: 0.2,
};

export const isValidDimensionScore = (n) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10;

// Validates that `scores` has exactly the expected shape: every
// required dimension present, and every value a number in [0, 10].
// Returns true/false rather than throwing — the caller decides how
// to surface a failure (here, as a clean "analysis failed" error).
export const isValidScoreSet = (scores) => {
  if (!scores || typeof scores !== "object") return false;
  return QUALITY_DIMENSIONS.every((dim) => isValidDimensionScore(scores[dim]));
};

// Deterministic weighted average, rounded to one decimal place.
// Assumes `scores` has already passed isValidScoreSet.
export const calculateOverallScore = (scores) => {
  const total = QUALITY_DIMENSIONS.reduce(
    (sum, dim) => sum + scores[dim] * QUALITY_WEIGHTS[dim],
    0
  );
  return Number(total.toFixed(1));
};
