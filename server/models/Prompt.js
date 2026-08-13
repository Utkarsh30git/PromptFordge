import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "untitled.prompt",
    },

    // Mirrors the content of the most recently saved version, so the
    // sidebar/list views never need to join against PromptVersion just
    // to show what a prompt currently contains.
    content: {
      type: String,
      maxlength: 20_000,
      default: "",
    },

    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },

    // Lets a user star a prompt for quick access from the Library's
    // "Favorites" filter, without opening the Workspace.
    isFavorite: {
      type: Boolean,
      default: false,
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
