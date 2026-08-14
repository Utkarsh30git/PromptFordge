import Prompt from "../models/Prompt.js";
import PromptVersion from "../models/PromptVersion.js";
import Collection from "../models/Collection.js";
import User from "../models/User.js";
import {
  runPrompt as callOpenAI,
  optimizePrompt as callOpenAIOptimize,
  analyzePromptQuality as callOpenAIAnalyze,
} from "../services/openaiService.js";
import {
  DEFAULT_MODEL,
  isSupportedModel,
  getSupportedModels,
  calculateCost,
} from "../config/modelPricing.js";
import { calculateOverallScore } from "../config/qualityScoring.js";
import { isValidObjectId, findOwnedPrompt } from "../utils/promptOwnership.js";
import { reserveCredit, refundCredit } from "../utils/credits.js";
import PromptRun from "../models/PromptRun.js";
import { extractVariables, findMissingVariables, resolveVariables } from "../utils/promptVariables.js";

const MAX_TITLE_LENGTH = 200;
const MAX_PROMPT_CONTENT_LENGTH = 20_000;
const MAX_VARIABLE_KEYS = 50;
const MAX_VARIABLE_VALUE_LENGTH = 5_000;

const mapOpenAIErrorStatus = (err) => {
  if (err.code === "TIMEOUT") return 504;
  if (err.code === "MISSING_API_KEY") return 500;
  return 502;
};

const mapOpenAIErrorMessage = (err) => {
  if (err.code === "TIMEOUT") return "The AI request timed out. Please try again.";
  if (err.code === "MISSING_API_KEY") return "AI execution is not configured on the server yet.";
  return "The AI provider failed to respond. Please try again.";
};

const sanitizeVariableValues = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const values = {};
  for (const [name, value] of Object.entries(raw)) {
    if (Object.keys(values).length >= MAX_VARIABLE_KEYS) break;
    if (typeof value === "string" || typeof value === "number") {
      values[name] = String(value).slice(0, MAX_VARIABLE_VALUE_LENGTH);
    }
  }
  return values;
};

const getLatestVersionId = async (promptId) => {
  const latest = await PromptVersion.findOne({ promptId }).sort({
    versionNumber: -1,
  });
  return latest?._id || null;
};

const logPromptRun = async (entry) => {
  try {
    await PromptRun.create(entry);
  } catch (err) {
    console.error("Failed to log prompt run:", err.message);
  }
};

const validateOwnedCollectionId = async (collectionId, userId, res) => {
  if (!collectionId) return null;

  if (!isValidObjectId(collectionId)) {
    res.status(400).json({ message: "Invalid collection id" });
    return true;
  }

  const ownsCollection = await Collection.findOne({
    _id: collectionId,
    userId,
  });

  if (!ownsCollection) {
    res.status(404).json({ message: "Collection not found" });
    return true;
  }

  return null;
};

export const createPrompt = async (req, res) => {
  try {
    const { title, collection: collectionId } = req.body;

    if (typeof title === "string" && title.trim().length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      });
    }

    const failed = await validateOwnedCollectionId(collectionId, req.userId, res);
    if (failed) return;

    const prompt = await Prompt.create({
      title: title?.trim() || "untitled.prompt",
      content: "",
      collectionId: collectionId || null,
      userId: req.userId,
    });

    return res.status(201).json({
      message: "Prompt created",
      prompt,
    });
  } catch (error) {
    console.error("Create prompt error:", error);

    return res.status(500).json({
      message: "Failed to create prompt",
    });
  }
};

const SORT_OPTIONS = {
  newest: { updatedAt: -1 },
  oldest: { updatedAt: 1 },
  name_asc: { title: 1 },
  name_desc: { title: -1 },
};

const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getPrompts = async (req, res) => {
  try {
    const { collection: collectionId, search, filter, sort } = req.query;
    const query = { userId: req.userId };

    if (collectionId) {
      if (!isValidObjectId(collectionId)) {
        return res.status(400).json({ message: "Invalid collection id" });
      }
      query.collectionId = collectionId;
    }

    if (search && typeof search === "string" && search.trim()) {

      const pattern = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [{ title: pattern }, { content: pattern }];
    }

    if (filter === "favorites") {
      query.isFavorite = true;
    } else if (filter === "recent") {
      query.updatedAt = { $gte: new Date(Date.now() - RECENT_WINDOW_MS) };
    }

    const sortSpec = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

    const prompts = await Prompt.find(query).sort(sortSpec);

    const promptIds = prompts.map((p) => p._id);
    const latestVersions = await PromptVersion.aggregate([
      { $match: { promptId: { $in: promptIds } } },
      { $group: { _id: "$promptId", latestVersionNumber: { $max: "$versionNumber" } } },
    ]);
    const versionByPromptId = new Map(
      latestVersions.map((v) => [String(v._id), v.latestVersionNumber])
    );

    const promptsWithVersion = prompts.map((p) => ({
      ...p.toObject(),
      latestVersionNumber: versionByPromptId.get(String(p._id)) || null,
    }));

    return res.status(200).json({
      prompts: promptsWithVersion,
    });
  } catch (error) {
    console.error("Get prompts error:", error);

    return res.status(500).json({
      message: "Failed to load prompts",
    });
  }
};

export const setFavorite = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { isFavorite } = req.body;
    if (typeof isFavorite !== "boolean") {
      return res.status(400).json({ message: "isFavorite must be a boolean" });
    }

    prompt.isFavorite = isFavorite;
    await prompt.save();

    return res.status(200).json({
      message: isFavorite ? "Added to favorites" : "Removed from favorites",
      prompt,
    });
  } catch (error) {
    console.error("Set favorite error:", error);

    return res.status(500).json({
      message: "Failed to update favorite",
    });
  }
};

export const getPromptById = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    return res.status(200).json({ prompt });
  } catch (error) {
    console.error("Get prompt error:", error);

    return res.status(500).json({
      message: "Failed to load prompt",
    });
  }
};

export const updatePrompt = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { title, collection: collectionId } = req.body;

    if (typeof title === "string" && title.trim().length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      });
    }

    if (collectionId !== undefined) {
      const failed = await validateOwnedCollectionId(collectionId, req.userId, res);
      if (failed) return;

      prompt.collectionId = collectionId || null;
    }

    if (title !== undefined && title.trim()) {
      prompt.title = title.trim();
    }

    await prompt.save();

    return res.status(200).json({
      message: "Prompt updated",
      prompt,
    });
  } catch (error) {
    console.error("Update prompt error:", error);

    return res.status(500).json({
      message: "Failed to update prompt",
    });
  }
};

export const deletePrompt = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    await PromptVersion.deleteMany({ promptId: prompt._id });
    await prompt.deleteOne();

    return res.status(200).json({
      message: "Prompt deleted",
    });
  } catch (error) {
    console.error("Delete prompt error:", error);

    return res.status(500).json({
      message: "Failed to delete prompt",
    });
  }
};

export const savePromptVersion = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { title, content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (typeof content !== "string" || content.length > MAX_PROMPT_CONTENT_LENGTH) {
      return res.status(400).json({
        message: `Content must be ${MAX_PROMPT_CONTENT_LENGTH.toLocaleString()} characters or fewer`,
      });
    }

    if (typeof title === "string" && title.trim().length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      });
    }

    const lastVersion = await PromptVersion.findOne({
      promptId: prompt._id,
    }).sort({ versionNumber: -1 });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = await PromptVersion.create({
      promptId: prompt._id,
      versionNumber: nextVersionNumber,
      content,
    });

    prompt.content = content;
    if (title !== undefined && title.trim()) {
      prompt.title = title.trim();
    }
    await prompt.save();

    return res.status(201).json({
      message: `Saved version ${nextVersionNumber}`,
      prompt,
      version,
    });
  } catch (error) {
    console.error("Save prompt version error:", error);

    return res.status(500).json({
      message: "Failed to save prompt version",
    });
  }
};

export const getPromptVersions = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const versions = await PromptVersion.find({
      promptId: prompt._id,
    }).sort({ versionNumber: 1 });

    return res.status(200).json({ versions });
  } catch (error) {
    console.error("Get prompt versions error:", error);

    return res.status(500).json({
      message: "Failed to load prompt versions",
    });
  }
};

export const runPromptExecution = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const content = (prompt.content || "").trim();
    if (!content) {
      return res.status(400).json({
        message:
          "This prompt has no saved content to run. Write something and save a version first.",
      });
    }

    let { model, temperature, variables } = req.body || {};

    const variableValues = sanitizeVariableValues(variables);
    const missing = findMissingVariables(content, variableValues);
    if (missing.length > 0) {
      return res.status(400).json({
        message:
          missing.length === 1
            ? `Missing value for: ${missing[0]}`
            : `Missing values for: ${missing.join(", ")}`,
        missingVariables: missing,
      });
    }
    const resolvedContent = resolveVariables(content, variableValues);

    model = model || DEFAULT_MODEL;
    if (!isSupportedModel(model)) {
      return res.status(400).json({
        message: `Unsupported model "${model}". Supported models: ${getSupportedModels().join(
          ", "
        )}`,
      });
    }

    if (temperature === undefined || temperature === null || temperature === "") {
      temperature = 0.7;
    }
    temperature = Number(temperature);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      return res.status(400).json({
        message: "Temperature must be a number between 0 and 2",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits <= 0) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep running prompts.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "AI execution is not configured on the server yet.",
      });
    }

    const reservedUser = await reserveCredit(req.userId);
    if (!reservedUser) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep running prompts.",
      });
    }

    const startedAt = Date.now();
    let result;

    try {
      result = await callOpenAI({ prompt: resolvedContent, model, temperature });
    } catch (err) {
      console.error("OpenAI run error:", err.message);

      await refundCredit(req.userId);

      if (err.code === "TIMEOUT") {
        return res.status(504).json({
          message: "The AI request timed out. Please try again.",
        });
      }

      if (err.code === "MISSING_API_KEY") {
        return res.status(500).json({
          message: "AI execution is not configured on the server yet.",
        });
      }

      return res.status(502).json({
        message: "The AI provider failed to respond. Please try again.",
      });
    }

    const latencyMs = Date.now() - startedAt;
    const cost = calculateCost(model, result.usage);

    await logPromptRun({
      userId: req.userId,
      promptId: prompt._id,
      versionId: await getLatestVersionId(prompt._id),
      type: "run",
      model: result.model,
      temperature,
      latencyMs,
      promptTokens: result.usage?.prompt_tokens ?? null,
      completionTokens: result.usage?.completion_tokens ?? null,
      totalTokens: result.usage?.total_tokens ?? null,
      cost,
      response: result.response,
    });

    return res.status(200).json({
      response: result.response,
      model: result.model,
      temperature,
      latency: latencyMs,
      tokens: result.usage?.total_tokens ?? null,
      promptTokens: result.usage?.prompt_tokens ?? null,
      completionTokens: result.usage?.completion_tokens ?? null,
      cost,
      creditsRemaining: reservedUser.credits,
      resolvedPrompt: resolvedContent,
    });
  } catch (error) {
    console.error("Run prompt error:", error);

    return res.status(500).json({
      message: "Failed to run prompt",
    });
  }
};

export const optimizePromptExecution = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const content = (prompt.content || "").trim();
    if (!content) {
      return res.status(400).json({
        message:
          "This prompt has no saved content to optimize. Write something and save a version first.",
      });
    }

    const model = DEFAULT_MODEL;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits <= 0) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep optimizing prompts.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "AI execution is not configured on the server yet.",
      });
    }

    const reservedUser = await reserveCredit(req.userId);
    if (!reservedUser) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep optimizing prompts.",
      });
    }

    const startedAt = Date.now();
    let result;

    try {
      result = await callOpenAIOptimize({ prompt: content, model });
    } catch (err) {
      console.error("OpenAI optimize error:", err.message);
      await refundCredit(req.userId);

      if (err.code === "TIMEOUT") {
        return res.status(504).json({
          message: "The AI request timed out. Please try again.",
        });
      }

      if (err.code === "MISSING_API_KEY") {
        return res.status(500).json({
          message: "AI execution is not configured on the server yet.",
        });
      }

      return res.status(502).json({
        message: "The AI provider failed to respond. Please try again.",
      });
    }

    const latencyMs = Date.now() - startedAt;
    const cost = calculateCost(model, result.usage);

    const originalVars = extractVariables(content);
    const optimizedVars = extractVariables(result.optimizedPrompt);
    const droppedVars = originalVars.filter((v) => !optimizedVars.includes(v));
    if (droppedVars.length > 0) {
      console.error(
        `Optimize dropped variable(s) [${droppedVars.join(", ")}] for prompt ${prompt._id}`
      );
    }

    await logPromptRun({
      userId: req.userId,
      promptId: prompt._id,
      versionId: await getLatestVersionId(prompt._id),
      type: "optimize",
      model: result.model,
      temperature: null,
      latencyMs,
      promptTokens: result.usage?.prompt_tokens ?? null,
      completionTokens: result.usage?.completion_tokens ?? null,
      totalTokens: result.usage?.total_tokens ?? null,
      cost,
      response: result.optimizedPrompt,
    });

    return res.status(200).json({
      optimizedPrompt: result.optimizedPrompt,
      model: result.model,
      latency: latencyMs,
      tokens: result.usage?.total_tokens ?? null,
      cost,
      creditsRemaining: reservedUser.credits,
    });
  } catch (error) {
    console.error("Optimize prompt error:", error);

    return res.status(500).json({
      message: "Failed to optimize prompt",
    });
  }
};

export const analyzePromptExecution = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { versionId } = req.body || {};

    let content;

    if (versionId !== undefined && versionId !== null && versionId !== "") {
      if (!isValidObjectId(versionId)) {
        return res.status(400).json({ message: "Invalid version id" });
      }

      const version = await PromptVersion.findOne({
        _id: versionId,
        promptId: prompt._id,
      });

      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }

      content = version.content;
    } else {
      const latestVersion = await PromptVersion.findOne({
        promptId: prompt._id,
      }).sort({ versionNumber: -1 });

      content = latestVersion ? latestVersion.content : prompt.content;
    }

    content = (content || "").trim();
    if (!content) {
      return res.status(400).json({
        message:
          "This prompt has no saved content to analyze. Write something and save a version first.",
      });
    }

    const model = DEFAULT_MODEL;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits <= 0) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep analyzing prompts.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "AI execution is not configured on the server yet.",
      });
    }

    const reservedUser = await reserveCredit(req.userId);
    if (!reservedUser) {
      return res.status(402).json({
        message: "You're out of credits. Upgrade your plan to keep analyzing prompts.",
      });
    }

    let result;
    try {
      result = await callOpenAIAnalyze({ prompt: content, model });
    } catch (err) {
      console.error("OpenAI analyze error:", err.message);
      await refundCredit(req.userId);

      if (err.code === "ANALYSIS_INVALID_RESPONSE") {
        return res.status(502).json({
          message: "Unable to analyze this prompt right now. Please try again.",
        });
      }

      return res.status(mapOpenAIErrorStatus(err)).json({
        message: mapOpenAIErrorMessage(err),
      });
    }

    const overallScore = calculateOverallScore(result.scores);

    return res.status(200).json({
      overallScore,
      scores: result.scores,
      summary: result.summary,
      suggestions: result.suggestions,
      model: result.model,
      creditsRemaining: reservedUser.credits,
    });
  } catch (error) {
    console.error("Analyze prompt error:", error);

    return res.status(500).json({
      message: "Failed to analyze this prompt",
    });
  }
};
