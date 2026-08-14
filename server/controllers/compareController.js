import PromptVersion from "../models/PromptVersion.js";
import User from "../models/User.js";
import PromptRun from "../models/PromptRun.js";
import Comparison from "../models/Comparison.js";
import { findOwnedPrompt, isValidObjectId } from "../utils/promptOwnership.js";
import { reserveCredit, refundCredit } from "../utils/credits.js";
import {
  runPrompt as callOpenAI,
  judgeComparison,
} from "../services/openaiService.js";
import {
  DEFAULT_MODEL,
  isSupportedModel,
  getSupportedModels,
  calculateCost,
} from "../config/modelPricing.js";
import { findMissingVariables, resolveVariables } from "../utils/promptVariables.js";

const MAX_TEST_INPUT_LENGTH = 10_000;
const MAX_VARIABLE_KEYS = 50;
const MAX_VARIABLE_VALUE_LENGTH = 5_000;

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

const timedRun = async (args) => {
  const startedAt = Date.now();
  const result = await callOpenAI(args);
  return { ...result, latencyMs: Date.now() - startedAt };
};

const buildSideResult = (version, resolvedContent, run, model) => ({
  versionId: version._id,
  versionNumber: version.versionNumber,
  promptContent: version.content,
  resolvedPrompt: resolvedContent,
  response: run.response,
  latency: run.latencyMs,
  promptTokens: run.usage?.prompt_tokens ?? null,
  completionTokens: run.usage?.completion_tokens ?? null,
  tokens: run.usage?.total_tokens ?? null,
  cost: calculateCost(model, run.usage),
});

export const compareVersions = async (req, res) => {
  try {
    const {
      promptId,
      versionAId,
      versionBId,
      input,
      model: requestedModel,
      temperature: requestedTemperature,
      variables,
    } = req.body || {};

    if (!promptId || !versionAId || !versionBId) {
      return res.status(400).json({
        message: "promptId, versionAId, and versionBId are all required",
      });
    }

    if (versionAId === versionBId) {
      return res.status(400).json({
        message: "Choose two different versions to compare",
      });
    }

    const testInput = (input || "").trim();
    if (!testInput) {
      return res.status(400).json({
        message: "Enter a test input to run both prompts against",
      });
    }
    if (testInput.length > MAX_TEST_INPUT_LENGTH) {
      return res.status(400).json({
        message: `Test input must be ${MAX_TEST_INPUT_LENGTH.toLocaleString()} characters or fewer`,
      });
    }

    const prompt = await findOwnedPrompt(promptId, req.userId);
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    if (!isValidObjectId(versionAId) || !isValidObjectId(versionBId)) {
      return res.status(400).json({ message: "Invalid version id" });
    }

    const [versionA, versionB] = await Promise.all([
      PromptVersion.findOne({ _id: versionAId, promptId: prompt._id }),
      PromptVersion.findOne({ _id: versionBId, promptId: prompt._id }),
    ]);

    if (!versionA || !versionB) {
      return res.status(404).json({ message: "Version not found" });
    }

    const variableValues = sanitizeVariableValues(variables);
    const missing = [
      ...new Set([
        ...findMissingVariables(versionA.content, variableValues),
        ...findMissingVariables(versionB.content, variableValues),
      ]),
    ];
    if (missing.length > 0) {
      return res.status(400).json({
        message:
          missing.length === 1
            ? `Missing value for: ${missing[0]}`
            : `Missing values for: ${missing.join(", ")}`,
        missingVariables: missing,
      });
    }
    const resolvedA = resolveVariables(versionA.content, variableValues);
    const resolvedB = resolveVariables(versionB.content, variableValues);

    const model = requestedModel || DEFAULT_MODEL;
    if (!isSupportedModel(model)) {
      return res.status(400).json({
        message: `Unsupported model "${model}". Supported models: ${getSupportedModels().join(
          ", "
        )}`,
      });
    }

    let temperature = requestedTemperature;
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
        message: "You're out of credits. Upgrade your plan to keep comparing prompts.",
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
        message: "You're out of credits. Upgrade your plan to keep comparing prompts.",
      });
    }

    const promptAText = `${resolvedA}\n\n${testInput}`;
    const promptBText = `${resolvedB}\n\n${testInput}`;

    let runA;
    let runB;

    try {
      [runA, runB] = await Promise.all([
        timedRun({ prompt: promptAText, model, temperature }),
        timedRun({ prompt: promptBText, model, temperature }),
      ]);
    } catch (err) {
      console.error("Compare execution error:", err.message);
      await refundCredit(req.userId);
      return res.status(mapOpenAIErrorStatus(err)).json({
        message: mapOpenAIErrorMessage(err),
      });
    }

    let judged;
    try {
      judged = await judgeComparison({
        input: testInput,
        promptA: resolvedA,
        responseA: runA.response,
        promptB: resolvedB,
        responseB: runB.response,
        model,
      });
    } catch (err) {
      console.error("Compare judge error:", err.message);
      await refundCredit(req.userId);
      return res.status(mapOpenAIErrorStatus(err)).json({
        message:
          err.code === "JUDGE_INVALID_RESPONSE"
            ? "The AI judge returned an unusable result. Please try again."
            : mapOpenAIErrorMessage(err),
      });
    }

    try {
      const comparison = await Comparison.create({
        userId: req.userId,
        promptId: prompt._id,
        versionAId: versionA._id,
        versionBId: versionB._id,
        testInput,
        model,
        scoreA: judged.scoreA,
        scoreB: judged.scoreB,
        winner: judged.winner,
        reason: judged.reason || "",
      });

      await PromptRun.insertMany([
        {
          userId: req.userId,
          promptId: prompt._id,
          versionId: versionA._id,
          type: "compare",
          comparisonId: comparison._id,
          model,
          temperature,
          latencyMs: runA.latencyMs,
          promptTokens: runA.usage?.prompt_tokens ?? null,
          completionTokens: runA.usage?.completion_tokens ?? null,
          totalTokens: runA.usage?.total_tokens ?? null,
          cost: calculateCost(model, runA.usage),
          response: runA.response,
        },
        {
          userId: req.userId,
          promptId: prompt._id,
          versionId: versionB._id,
          type: "compare",
          comparisonId: comparison._id,
          model,
          temperature,
          latencyMs: runB.latencyMs,
          promptTokens: runB.usage?.prompt_tokens ?? null,
          completionTokens: runB.usage?.completion_tokens ?? null,
          totalTokens: runB.usage?.total_tokens ?? null,
          cost: calculateCost(model, runB.usage),
          response: runB.response,
        },
      ]);
    } catch (logErr) {
      console.error("Failed to log comparison:", logErr.message);
    }

    return res.status(200).json({
      input: testInput,
      model,
      temperature,
      promptId: prompt._id,
      a: buildSideResult(versionA, resolvedA, runA, model),
      b: buildSideResult(versionB, resolvedB, runB, model),
      judge: {
        scoreA: judged.scoreA,
        scoreB: judged.scoreB,
        winner: judged.winner,
        reason: judged.reason,
      },
      creditsRemaining: reservedUser.credits,
    });
  } catch (error) {
    console.error("Compare error:", error);

    return res.status(500).json({
      message: "Failed to compare prompts",
    });
  }
};

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
