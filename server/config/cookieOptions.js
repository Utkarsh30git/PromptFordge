// Single source of truth for the PromptForge auth cookie's
// attributes — used by BOTH login (set) and logout (clear). If
// those two ever drift out of sync (e.g. secure/sameSite differ
// between the res.cookie() call and the res.clearCookie() call),
// browsers can silently fail to actually clear the cookie, leaving
// a "logged out" user still holding a valid session cookie.
//
// Environment-aware rather than hardcoded, so local development
// (frontend + backend on http://localhost, different ports — same
// site, different origin) keeps working exactly as before, while a
// production deployment (typically separate domains/subdomains over
// HTTPS) gets the attributes it actually needs for the cookie to be
// sent on cross-site requests at all.
const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "promptforge_token";

export const authCookieOptions = {
  httpOnly: true,
  // Browsers reject `secure: true` cookies over plain http, which is
  // what local development uses — so this must stay environment-aware
  // rather than hardcoded to true.
  secure: isProd,
  // Cross-site (separate frontend/backend domains) requests with
  // credentials require SameSite=None, which in turn requires
  // Secure=true (already true in prod, above). Locally, "lax" is
  // both sufficient and doesn't require HTTPS.
  sameSite: isProd ? "none" : "lax",
};

export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
