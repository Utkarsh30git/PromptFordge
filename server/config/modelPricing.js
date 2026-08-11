// Centralized model + pricing configuration for prompt execution.
//
// Prices are USD per 1,000,000 tokens, matching OpenAI's published API
// pricing (verified against openai.com/api/pricing as of this writing).
// To support a new model later: add an entry here — nothing in the
// controller or service layer needs to change.
const MODEL_PRICING = {
  "gpt-4.1": {
    label: "GPT-4.1",
    inputPerMillion: 2.0,
    outputPerMillion: 8.0,
  },
};

export const DEFAULT_MODEL = "gpt-4.1";

export const isSupportedModel = (model) =>
  Object.prototype.hasOwnProperty.call(MODEL_PRICING, model);

export const getSupportedModels = () => Object.keys(MODEL_PRICING);

// usage is OpenAI's usage object: { prompt_tokens, completion_tokens, total_tokens }
export const calculateCost = (model, usage) => {
  const pricing = MODEL_PRICING[model];
  if (!pricing || !usage) return null;

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;

  return Number((inputCost + outputCost).toFixed(6));
};
