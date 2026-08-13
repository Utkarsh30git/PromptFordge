import mongoose from "mongoose";
import Collection from "../models/Collection.js";
import Prompt from "../models/Prompt.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Collection name is required",
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Collection name must be 100 characters or fewer",
      });
    }

    const existing = await Collection.findOne({
      userId: req.userId,
      name: trimmedName,
    });

    if (existing) {
      return res.status(409).json({
        message: "You already have a collection with this name",
      });
    }

    const collection = await Collection.create({
      name: trimmedName,
      userId: req.userId,
    });

    return res.status(201).json({
      message: "Collection created",
      collection,
    });
  } catch (error) {
    // The findOne-then-create above still has a race window (two
    // simultaneous requests can both pass the pre-check) — the
    // schema's unique index is the real guarantee. If it fires, that
    // means the race happened; report it the same clean way the
    // pre-check would have, not as a raw Mongo error.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a collection with this name",
      });
    }

    console.error("Create collection error:", error);

    return res.status(500).json({
      message: "Failed to create collection",
    });
  }
};

// GET /api/collections
// Includes a promptCount per collection (for the Library's Collections
// view) via one grouped aggregation rather than a query per collection.
export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({
      userId: req.userId,
    }).sort({ createdAt: 1 });

    const counts = await Prompt.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          collectionId: { $ne: null },
        },
      },
      { $group: { _id: "$collectionId", count: { $sum: 1 } } },
    ]);
    const countByCollectionId = new Map(
      counts.map((c) => [String(c._id), c.count])
    );

    const collectionsWithCounts = collections.map((c) => ({
      ...c.toObject(),
      promptCount: countByCollectionId.get(String(c._id)) || 0,
    }));

    return res.status(200).json({
      collections: collectionsWithCounts,
    });
  } catch (error) {
    console.error("Get collections error:", error);

    return res.status(500).json({
      message: "Failed to load collections",
    });
  }
};

// PUT /api/collections/:id
export const updateCollection = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid collection id" });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Collection name is required",
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Collection name must be 100 characters or fewer",
      });
    }

    const collection = await Collection.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    // Ownership check: if it's not found for THIS user, treat it as
    // not existing at all — never confirm another user's data exists.
    if (!collection) {
      return res.status(404).json({
        message: "Collection not found",
      });
    }

    collection.name = trimmedName;
    await collection.save();

    return res.status(200).json({
      message: "Collection updated",
      collection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a collection with this name",
      });
    }

    console.error("Update collection error:", error);

    return res.status(500).json({
      message: "Failed to update collection",
    });
  }
};

// DELETE /api/collections/:id
export const deleteCollection = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid collection id" });
    }

    const collection = await Collection.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!collection) {
      return res.status(404).json({
        message: "Collection not found",
      });
    }

    // Prompts aren't deleted with their collection — they're just
    // unassigned, so nobody's work silently disappears.
    await Prompt.updateMany(
      { collectionId: collection._id, userId: req.userId },
      { $set: { collectionId: null } }
    );

    await collection.deleteOne();

    return res.status(200).json({
      message: "Collection deleted",
    });
  } catch (error) {
    console.error("Delete collection error:", error);

    return res.status(500).json({
      message: "Failed to delete collection",
    });
  }
};
