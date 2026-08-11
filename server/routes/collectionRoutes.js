import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createCollection,
  getCollections,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController.js";

const router = express.Router();

// Every collection route requires an authenticated user.
router.use(authMiddleware);

router.post("/", createCollection);
router.get("/", getCollections);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;
