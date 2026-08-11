import mongoose from "mongoose";

// One row per completed Compare action. Deliberately does NOT store
// the AI response text for either side — that already lives in the
// two PromptRun ("compare" type) records this comparison produced,
// referenced back via those records' comparisonId. This model only
// holds what's specific to the comparison itself: which two versions
// were pitted against each other, the shared test input, and the
// judge's verdict.
const comparisonSchema = new mongoose.Schema({
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

  versionAId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromptVersion",
    required: true,
  },

  versionBId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromptVersion",
    required: true,
  },

  testInput: {
    type: String,
    required: true,
  },

  model: {
    type: String,
    required: true,
  },

  scoreA: { type: Number, required: true },
  scoreB: { type: Number, required: true },

  winner: {
    type: String,
    enum: ["A", "B", "tie"],
    required: true,
  },

  reason: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

comparisonSchema.index({ userId: 1, createdAt: -1 });
comparisonSchema.index({ userId: 1, promptId: 1 });

const Comparison = mongoose.model("Comparison", comparisonSchema);

export default Comparison;
