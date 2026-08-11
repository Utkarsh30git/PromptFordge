import Collection from "../models/Collection.js";
import Prompt from "../models/Prompt.js";

// POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Collection name is required",
      });
    }

    const existing = await Collection.findOne({
      userId: req.userId,
      name: name.trim(),
    });

    if (existing) {
      return res.status(409).json({
        message: "You already have a collection with this name",
      });
    }

    const collection = await Collection.create({
      name: name.trim(),
      userId: req.userId,
    });

    return res.status(201).json({
      message: "Collection created",
      collection,
    });
  } catch (error) {
    console.error("Create collection error:", error);

    return res.status(500).json({
      message: "Failed to create collection",
    });
  }
};

// GET /api/collections
export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({
      userId: req.userId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      collections,
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
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Collection name is required",
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

    collection.name = name.trim();
    await collection.save();

    return res.status(200).json({
      message: "Collection updated",
      collection,
    });
  } catch (error) {
    console.error("Update collection error:", error);

    return res.status(500).json({
      message: "Failed to update collection",
    });
  }
};

// DELETE /api/collections/:id
export const deleteCollection = async (req, res) => {
  try {
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
