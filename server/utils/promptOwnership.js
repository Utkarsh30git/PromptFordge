import mongoose from "mongoose";
import Prompt from "../models/Prompt.js";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared ownership lookup — every prompt-related route needs this,
// and it's the one place the "never touch another user's prompt"
// rule lives.
export const findOwnedPrompt = async (promptId, userId) => {
  if (!isValidObjectId(promptId)) return null;

  return Prompt.findOne({
    _id: promptId,
    userId,
  });
};
