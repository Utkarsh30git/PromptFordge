import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyGoogleToken } from "../services/googleAuth.js";
import {
  isValidAvatarPresetId,
  isPresetAvatarId,
  USE_GOOGLE_AVATAR,
} from "../config/avatarPresets.js";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  AUTH_COOKIE_MAX_AGE_MS,
} from "../config/cookieOptions.js";

// The one place a User document is shaped into what the client is
// allowed to see — used by every endpoint that returns a user, so
// nothing (password hashes if ever added, googleId, __v, etc.) leaks
// by accident just because a new field gets added to the schema.
const buildSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  googleAvatar: user.googleAvatar,
  plan: user.plan,
  credits: user.credits,
  createdAt: user.createdAt,
});

const MAX_NAME_LENGTH = 100;

// Lazily backfills `googleAvatar` for accounts created before that
// field existed: if it's empty but the currently active `avatar` is
// a Google URL (not a preset id), that URL IS their original Google
// avatar, so copy it across. A no-op — no write — for every account
// created after this field was added, since googleLogin already
// sets both fields together at creation time.
const backfillGoogleAvatar = async (user) => {
  if (!user.googleAvatar && user.avatar && !isPresetAvatarId(user.avatar)) {
    user.googleAvatar = user.avatar;
    await user.save();
  }
  return user;
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(credential);

    const { googleId, name, email, avatar } = googleUser;

    // Find existing user
    let user = await User.findOne({
      email,
    });

    // Create user if this is their first login
    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        avatar,
        googleAvatar: avatar,
      });
    } else {
      // Existing user: NEVER touch `avatar` here — if they've since
      // chosen a PromptForge preset, this login must not overwrite
      // it with their Google picture. Only lazily backfills
      // `googleAvatar` for pre-existing accounts that predate it.
      await backfillGoogleAvatar(user);
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Store JWT in HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, {
      ...authCookieOptions,
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    });

    return res.status(200).json({
      message: "Google login successful",
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      message: "Google authentication failed",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await backfillGoogleAvatar(user);

    return res.status(200).json({
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
};

// PATCH /api/auth/profile
// Only field editable today is `name` — email is the authenticated
// Google identity and isn't user-editable, per the current (Google-
// only) auth flow. req.userId comes from authMiddleware; the
// frontend never supplies which user to update.
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { name } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        message: `Name must be ${MAX_NAME_LENGTH} characters or fewer`,
      });
    }

    user.name = trimmedName;
    await user.save();

    return res.status(200).json({
      message: "Profile updated",
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

// PATCH /api/auth/avatar
// Body: { avatar: "preset-07" } to pick a PromptForge preset, or
// { avatar: "google" } to switch back to the user's original Google
// profile picture. No image bytes ever pass through this endpoint —
// only a small, server-validated identifier is stored.
export const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { avatar } = req.body || {};

    if (typeof avatar !== "string" || !avatar) {
      return res.status(400).json({
        message: "avatar is required",
      });
    }

    if (avatar === USE_GOOGLE_AVATAR) {
      if (!user.googleAvatar) {
        return res.status(400).json({
          message: "No Google avatar is available for this account",
        });
      }
      user.avatar = user.googleAvatar;
    } else if (isValidAvatarPresetId(avatar)) {
      user.avatar = avatar;
    } else {
      return res.status(400).json({
        message: "Unknown avatar selection",
      });
    }

    await user.save();

    return res.status(200).json({
      message: "Avatar updated",
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Update avatar error:", error);

    return res.status(500).json({
      message: "Failed to update avatar",
    });
  }
};

export const logout = (req, res) => {
  // Must use the SAME options (minus maxAge) as the res.cookie() call
  // in googleLogin — see config/cookieOptions.js for why a mismatch
  // here can silently fail to clear the cookie in some browsers.
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

  return res.status(200).json({
    message: "Logged out successfully",
  });
};


