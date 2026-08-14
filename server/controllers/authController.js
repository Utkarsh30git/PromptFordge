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


    const googleUser = await verifyGoogleToken(credential);

    const { googleId, name, email, avatar } = googleUser;


    let user = await User.findOne({
      email,
    });


    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        avatar,
        googleAvatar: avatar,
      });
    } else {

      await backfillGoogleAvatar(user);
    }


    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );


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

  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

  return res.status(200).json({
    message: "Logged out successfully",
  });
};


