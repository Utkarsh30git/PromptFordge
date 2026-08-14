import mongoose from "mongoose";

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

  versionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromptVersion",
    default: null,
  },

  type: {
    type: String,
    enum: ["run", "optimize", "compare"],
    required: true,
    index: true,
  },

  comparisonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comparison",
    default: null,
  },

  model: {
    type: String,
    required: true,
  },

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
