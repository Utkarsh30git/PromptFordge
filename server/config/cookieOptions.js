

const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "promptforge_token";

export const authCookieOptions = {
  httpOnly: true,

  secure: isProd,

  sameSite: isProd ? "none" : "lax",
};

export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
