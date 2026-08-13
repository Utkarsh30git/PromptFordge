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

// Every prompt route requires an authenticated user.
router.use(authMiddleware);

router.post("/", createPrompt);
router.get("/", getPrompts);

// Registered before "/:id" so the literal "compare" segment is
// never swallowed by the :id param route. AI-billed, so rate-limited
// the same as run/optimize/analyze below.
router.post("/compare", aiLimiter, compareVersions);

router.get("/:id", getPromptById);
router.put("/:id", updatePrompt);
router.delete("/:id", deletePrompt);

router.post("/:id/save", savePromptVersion);
router.get("/:id/versions", getPromptVersions);
router.put("/:id/favorite", setFavorite);

// Run/Optimize/Analyze are the OpenAI-billed, credit-consuming
// operations — rate-limited per-user (aiLimiter runs after
// authMiddleware above, so req.userId is already set).
router.post("/:id/run", aiLimiter, runPromptExecution);
router.post("/:id/optimize", aiLimiter, optimizePromptExecution);
router.post("/:id/analyze", aiLimiter, analyzePromptExecution);

export default router;
