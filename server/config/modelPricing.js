

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

export const calculateCost = (model, usage) => {
  const pricing = MODEL_PRICING[model];
  if (!pricing || !usage) return null;

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;

  return Number((inputCost + outputCost).toFixed(6));
};
