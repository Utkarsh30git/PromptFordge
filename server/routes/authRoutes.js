import express from "express";

import {
  googleLogin,
  getCurrentUser,
  logout
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/google", googleLogin);

router.get(
  "/current-user",
  authMiddleware,
  getCurrentUser
);

router.post("/logout", logout);

export default router;