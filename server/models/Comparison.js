import mongoose from "mongoose";

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
