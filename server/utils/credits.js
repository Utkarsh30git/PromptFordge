import User from "../models/User.js";

// Atomically checks-and-reserves one credit in a SINGLE MongoDB
// operation ($inc gated by a `credits > 0` filter in the same query).
// This is what actually prevents overspend under concurrency — a
// plain "read credits, check > 0, then save credits - 1" (the
// previous pattern) has a race window: two simultaneous requests can
// both read the same balance, both pass the check, and both deduct,
// leaving credits negative. Because MongoDB evaluates the filter and
// the $inc as one atomic operation, at most as many concurrent
// callers as there are actual credits can ever succeed here — a
// second caller arriving with the balance already at 0 simply
// doesn't match the filter and gets null back, full stop.
//
// Called BEFORE the OpenAI call (a "reservation"), paired with
// refundCredit() in the caller's catch block — so a request that
// fails after reserving still nets out to "credit not spent", while
// still closing the concurrent-overspend race that a spend-only-
// after-success model can't close on its own.
export const reserveCredit = async (userId) => {
  return User.findOneAndUpdate(
    { _id: userId, credits: { $gt: 0 } },
    { $inc: { credits: -1 } },
    { new: true }
  );
};

// Reverses reserveCredit — call this whenever the operation the
// credit was reserved for ends up failing (OpenAI error, timeout,
// malformed response, etc.), so a failed request never costs the
// user anything net. Just another atomic $inc, so it's race-safe
// the same way reserveCredit is.
export const refundCredit = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { credits: 1 } });
};
