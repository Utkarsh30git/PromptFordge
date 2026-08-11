import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
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
} from "../controllers/promptController.js";
import { compareVersions } from "../controllers/compareController.js";

const router = express.Router();

// Every prompt route requires an authenticated user.
router.use(authMiddleware);

router.post("/", createPrompt);
router.get("/", getPrompts);

// Registered before "/:id" so the literal "compare" segment is
// never swallowed by the :id param route.
router.post("/compare", compareVersions);

router.get("/:id", getPromptById);
router.put("/:id", updatePrompt);
router.delete("/:id", deletePrompt);

router.post("/:id/save", savePromptVersion);
router.get("/:id/versions", getPromptVersions);
router.post("/:id/run", runPromptExecution);
router.post("/:id/optimize", optimizePromptExecution);

export default router;
