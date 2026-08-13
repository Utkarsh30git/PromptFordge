import express from "express";

import {
  googleLogin,
  getCurrentUser,
  updateProfile,
  updateAvatar,
  logout
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/google", authLimiter, googleLogin);

router.get(
  "/current-user",
  authMiddleware,
  getCurrentUser
);

router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

router.patch(
  "/avatar",
  authMiddleware,
  updateAvatar
);

router.post("/logout", logout);

export default router;