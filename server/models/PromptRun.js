import mongoose from "mongoose";

// A single logged AI execution — created for every successful Run,
// every successful Optimize, and for EACH side of a successful
// Compare (linked back via comparisonId). This is the one source of
// truth Analytics aggregates over, so nothing here is invented after
// the fact — every row corresponds to a real OpenAI call that was
// actually billed (a credit was actually deducted for it).
const promptRunSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  promptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prompt",
    required: true,
    index: true,
  },

  // The specific saved version that was executed, when known.
  versionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromptVersion",
    default: null,
  },

  // "run" = Run Prompt, "optimize" = Optimize, "compare" = one side
  // of a Compare (see comparisonId).
  type: {
    type: String,
    enum: ["run", "optimize", "compare"],
    required: true,
    index: true,
  },

  // Only set when type === "compare" — links both sides back to the
  // single Comparison record that produced them.
  comparisonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comparison",
    default: null,
  },

  model: {
    type: String,
    required: true,
  },

  // Not meaningful for "optimize" (fixed internal temperature, not
  // user-facing), so left null for that type.
  temperature: {
    type: Number,
    default: null,
  },

  latencyMs: {
    type: Number,
    required: true,
  },

  promptTokens: { type: Number, default: null },
  completionTokens: { type: Number, default: null },
  totalTokens: { type: Number, default: null },

  cost: {
    type: Number,
    default: null,
  },

  // The generated text — the AI response for "run"/"compare", or the
  // rewritten prompt text for "optimize".
  response: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

promptRunSchema.index({ userId: 1, createdAt: -1 });
promptRunSchema.index({ userId: 1, promptId: 1 });

const PromptRun = mongoose.model("PromptRun", promptRunSchema);

export default PromptRun;
