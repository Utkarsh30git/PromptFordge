import mongoose from "mongoose";
import Prompt from "../models/Prompt.js";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const findOwnedPrompt = async (promptId, userId) => {
  if (!isValidObjectId(promptId)) return null;

  return Prompt.findOne({
    _id: promptId,
    userId,
  });
};
