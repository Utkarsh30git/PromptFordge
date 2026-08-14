import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in a few minutes." },
});

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
