

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

export const isValidScoreSet = (scores) => {
  if (!scores || typeof scores !== "object") return false;
  return QUALITY_DIMENSIONS.every((dim) => isValidDimensionScore(scores[dim]));
};

export const calculateOverallScore = (scores) => {
  const total = QUALITY_DIMENSIONS.reduce(
    (sum, dim) => sum + scores[dim] * QUALITY_WEIGHTS[dim],
    0
  );
  return Number(total.toFixed(1));
};
