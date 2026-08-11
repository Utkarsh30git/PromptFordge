import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A user shouldn't have two collections with the same name.
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
