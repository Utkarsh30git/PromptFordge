import Prompt from "../models/Prompt.js";
import PromptVersion from "../models/PromptVersion.js";
import Collection from "../models/Collection.js";
import User from "../models/User.js";
import { runPrompt as callOpenAI, optimizePrompt as callOpenAIOptimize } from "../services/openaiService.js";
import {
  DEFAULT_MODEL,
  isSupportedModel,
  getSupportedModels,
  calculateCost,
} from "../config/modelPricing.js";
import { isValidObjectId, findOwnedPrompt } from "../utils/promptOwnership.js";
import PromptRun from "../models/PromptRun.js";
import { extractVariables, findMissingVariables, resolveVariables } from "../utils/promptVariables.js";

// Coerces the client-submitted `variables` object into a plain
// { name: string } map. Anything that isn't a plain object, or whose
// values aren't strings/numbers, is dropped rather than trusted —
// this only ever feeds a string replace, but we still don't want
// stray objects/arrays flowing into resolution or logging.
const sanitizeVariableValues = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const values = {};
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === "string" || typeof value === "number") {
      values[name] = String(value);
    }
  }
  return values;
};

// Every "run" and "optimize" execution against a prompt runs its
// SAVED content, which always corresponds to the latest PromptVersion
// at that moment. Looked up once, here, so both execution paths log
// a consistent versionId without duplicating the query.
const getLatestVersionId = async (promptId) => {
  const latest = await PromptVersion.findOne({ promptId }).sort({
    versionNumber: -1,
  });
  return latest?._id || null;
};

// Logging a completed execution must never break the response the
// user is waiting on — if Analytics persistence fails for any reason,
// the AI result they paid a credit for still comes back normally.
const logPromptRun = async (entry) => {
  try {
    await PromptRun.create(entry);
  } catch (err) {
    console.error("Failed to log prompt run:", err.message);
  }
};

// Confirms `collectionId` (if provided) is a real ObjectId that
// belongs to the requesting user. Returns an error response object
// to send back, or null if everything checks out.
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

// POST /api/prompts
export const createPrompt = async (req, res) => {
  try {
    const { title, collection: collectionId } = req.body;

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

// GET /api/prompts?collection=<id>
export const getPrompts = async (req, res) => {
  try {
    const { collection: collectionId } = req.query;
    const query = { userId: req.userId };

    if (collectionId) {
      if (!isValidObjectId(collectionId)) {
        return res.status(400).json({ message: "Invalid collection id" });
      }
      query.collectionId = collectionId;
    }

    const prompts = await Prompt.find(query).sort({ updatedAt: -1 });

    return res.status(200).json({
      prompts,
    });
  } catch (error) {
    console.error("Get prompts error:", error);

    return res.status(500).json({
      message: "Failed to load prompts",
    });
  }
};

// GET /api/prompts/:id
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

// PUT /api/prompts/:id
// Metadata-only update (title / which collection it lives in).
// Does NOT create a new version — use /save for content changes.
export const updatePrompt = async (req, res) => {
  try {
    const prompt = await findOwnedPrompt(req.params.id, req.userId);

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { title, collection: collectionId } = req.body;

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

// DELETE /api/prompts/:id
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

// POST /api/prompts/:id/save
// The core "Save Version" action: persists the editor's current
// content as a brand new, immutable version, and updates the
// prompt's own title/content/updatedAt to match.
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

// GET /api/prompts/:id/versions
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

// POST /api/prompts/:id/run
// Executes the prompt's currently SAVED content against OpenAI.
// Content is read from the stored Prompt document, never trusted
// from the request body — the client only chooses model/temperature.
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

    // The template (with {{placeholders}} intact) is what's stored —
    // it's never overwritten. Variable values only ever produce a
    // resolved string used for THIS execution.
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

    // Never spend a credit on a request that hasn't even reached OpenAI yet.
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

    const startedAt = Date.now();
    let result;

    try {
      result = await callOpenAI({ prompt: resolvedContent, model, temperature });
    } catch (err) {
      console.error("OpenAI run error:", err.message);

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

    // Credit is only deducted once we know the run genuinely succeeded.
    user.credits -= 1;
    await user.save();

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
      creditsRemaining: user.credits,
      resolvedPrompt: resolvedContent,
    });
  } catch (error) {
    console.error("Run prompt error:", error);

    return res.status(500).json({
      message: "Failed to run prompt",
    });
  }
};

// POST /api/prompts/:id/optimize
// Rewrites the prompt's currently SAVED content into an improved
// prompt via OpenAI. This is a distinct operation from /run: it
// analyzes and improves the PROMPT ITSELF, it does not execute it.
// The rewritten prompt is returned for review only — it is NOT
// applied to the prompt/version here. The editor/version only change
// if the client later calls /save (via "Use Optimized Prompt" ->
// Save Version). A PromptRun log entry (type: "optimize") IS written
// for Analytics purposes, since a real, billed OpenAI call happened —
// but that's a history record, not a change to the prompt itself.
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

    // Never spend a credit on a request that hasn't even reached OpenAI yet.
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

    const startedAt = Date.now();
    let result;

    try {
      result = await callOpenAIOptimize({ prompt: content, model });
    } catch (err) {
      console.error("OpenAI optimize error:", err.message);

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

    // The optimizer is instructed to preserve {{variables}} verbatim,
    // but model output isn't guaranteed — this is a non-blocking
    // sanity check so a regression shows up in server logs instead of
    // silently shipping a template that lost its placeholders.
    const originalVars = extractVariables(content);
    const optimizedVars = extractVariables(result.optimizedPrompt);
    const droppedVars = originalVars.filter((v) => !optimizedVars.includes(v));
    if (droppedVars.length > 0) {
      console.error(
        `Optimize dropped variable(s) [${droppedVars.join(", ")}] for prompt ${prompt._id}`
      );
    }

    // Credit is only deducted once we know the run genuinely succeeded.
    user.credits -= 1;
    await user.save();

    await logPromptRun({
      userId: req.userId,
      promptId: prompt._id,
      versionId: await getLatestVersionId(prompt._id),
      type: "optimize",
      model: result.model,
      temperature: null, // fixed internal value, not user-facing
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
      creditsRemaining: user.credits,
    });
  } catch (error) {
    console.error("Optimize prompt error:", error);

    return res.status(500).json({
      message: "Failed to optimize prompt",
    });
  }
};
