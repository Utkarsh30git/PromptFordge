import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "untitled.prompt",
    },

    // Mirrors the content of the most recently saved version, so the
    // sidebar/list views never need to join against PromptVersion just
    // to show what a prompt currently contains.
    content: {
      type: String,
      default: "",
    },

    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

promptSchema.index({ userId: 1, collectionId: 1 });

const Prompt = mongoose.model("Prompt", promptSchema);

export default Prompt;
