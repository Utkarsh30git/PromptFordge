import mongoose from "mongoose";

const promptVersionSchema = new mongoose.Schema({
  promptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prompt",
    required: true,
    index: true,
  },

  versionNumber: {
    type: Number,
    required: true,
  },

  content: {
    type: String,
    required: true,
    maxlength: 20_000,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Version numbers are 1, 2, 3... per prompt and must never collide.
promptVersionSchema.index(
  { promptId: 1, versionNumber: 1 },
  { unique: true }
);

const PromptVersion = mongoose.model("PromptVersion", promptVersionSchema);

export default PromptVersion;
