import User from "../models/User.js";

export const reserveCredit = async (userId) => {
  return User.findOneAndUpdate(
    { _id: userId, credits: { $gt: 0 } },
    { $inc: { credits: -1 } },
    { new: true }
  );
};

export const refundCredit = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { credits: 1 } });
};
