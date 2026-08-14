import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import {
  createPrompt,
  getPrompts,
  getPromptById,
  updatePrompt,
  deletePrompt,
  savePromptVersion,
  getPromptVersions,
  runPromptExecution,
  optimizePromptExecution,
  analyzePromptExecution,
  setFavorite,
} from "../controllers/promptController.js";
import { compareVersions } from "../controllers/compareController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createPrompt);
router.get("/", getPrompts);

router.post("/compare", aiLimiter, compareVersions);

router.get("/:id", getPromptById);
router.put("/:id", updatePrompt);
router.delete("/:id", deletePrompt);

router.post("/:id/save", savePromptVersion);
router.get("/:id/versions", getPromptVersions);
router.put("/:id/favorite", setFavorite);

router.post("/:id/run", aiLimiter, runPromptExecution);
router.post("/:id/optimize", aiLimiter, optimizePromptExecution);
router.post("/:id/analyze", aiLimiter, analyzePromptExecution);

export default router;
