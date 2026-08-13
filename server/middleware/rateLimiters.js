import rateLimit from "express-rate-limit";

// Generous in development (so normal local iteration is never
// throttled), meaningfully tighter in production. Both are still
// "sensible" limits per the audit — not meant to make legitimate
// heavy use of the product impossible, only to blunt automated abuse.
const isProd = process.env.NODE_ENV === "production";

// Login is unauthenticated and public — this is the one place
// rate-limiting has to be keyed by IP (there's no req.userId yet).
// Bounds credential-stuffing / brute-force attempts against
// POST /api/auth/google without making normal login (a handful of
// attempts per session, including retries) unusable.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in a few minutes." },
});

// Run / Optimize / Analyze / Compare are the expensive, OpenAI-
// billed operations — the ones actually worth protecting against a
// runaway client or script. Keyed by the authenticated user
// (req.userId, set by authMiddleware, which always runs before this
// on every route it's applied to) rather than by IP, since multiple
// people can legitimately share an IP (offices, NAT, campus wifi)
// and one person's usage shouldn't throttle everyone else on it.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 60 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  message: {
    message: "Too many AI requests. Please slow down and try again shortly.",
  },
});
