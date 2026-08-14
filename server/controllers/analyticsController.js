import mongoose from "mongoose";
import PromptRun from "../models/PromptRun.js";
import Comparison from "../models/Comparison.js";
import Prompt from "../models/Prompt.js";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

const resolveRangeStart = (range) => {
  if (range === "all") return null;

  const days = RANGE_DAYS[range] ?? RANGE_DAYS["30d"];
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
};

const dateMatch = (since) => (since ? { createdAt: { $gte: since } } : {});

export const getAnalytics = async (req, res) => {
  try {
    const range = ["7d", "30d", "90d", "all"].includes(req.query.range)
      ? req.query.range
      : "30d";

    const since = resolveRangeStart(range);
    const userId = new mongoose.Types.ObjectId(req.userId);
    const runMatch = { userId, type: "run", ...dateMatch(since) };
    const allTypesMatch = { userId, ...dateMatch(since) };
    const compareMatch = { userId, ...dateMatch(since) };

    const [
      runStatsAgg,
      spendAgg,
      qualityAgg,
      runsTrendAgg,
      costTrendAgg,
      tokensTrendAgg,
      topPromptsAgg,
      modelUsageAgg,
      comparisonAgg,
      recentRuns,
      recentComparisons,
    ] = await Promise.all([
      PromptRun.aggregate([
        { $match: runMatch },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            avgLatency: { $avg: "$latencyMs" },
          },
        },
      ]),

      PromptRun.aggregate([
        { $match: allTypesMatch },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$totalTokens" },
            totalCost: { $sum: "$cost" },
          },
        },
      ]),

      Comparison.aggregate([
        { $match: compareMatch },
        { $project: { pairAvg: { $avg: ["$scoreA", "$scoreB"] } } },
        { $group: { _id: null, avgQuality: { $avg: "$pairAvg" } } },
      ]),

      PromptRun.aggregate([
        { $match: runMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      PromptRun.aggregate([
        { $match: allTypesMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$cost" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      PromptRun.aggregate([
        { $match: allTypesMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalTokens" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      PromptRun.aggregate([
        { $match: runMatch },
        { $group: { _id: "$promptId", runs: { $sum: 1 } } },
        { $sort: { runs: -1 } },
        { $limit: 5 },
      ]),

      PromptRun.aggregate([
        { $match: allTypesMatch },
        { $group: { _id: "$model", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Comparison.aggregate([
        { $match: compareMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            aWins: { $sum: { $cond: [{ $eq: ["$winner", "A"] }, 1, 0] } },
            bWins: { $sum: { $cond: [{ $eq: ["$winner", "B"] }, 1, 0] } },
            ties: { $sum: { $cond: [{ $eq: ["$winner", "tie"] }, 1, 0] } },
            avgImprovement: {
              $avg: { $abs: { $subtract: ["$scoreA", "$scoreB"] } },
            },
          },
        },
      ]),

      PromptRun.find({
        userId,
        type: { $in: ["run", "optimize"] },
        ...dateMatch(since),
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("promptId versionId type model createdAt"),

      Comparison.find(compareMatch)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("promptId versionAId versionBId winner createdAt"),
    ]);

    const totalRuns = runStatsAgg[0]?.totalRuns ?? 0;
    const avgLatency = runStatsAgg[0]?.avgLatency ?? null;
    const totalTokens = spendAgg[0]?.totalTokens ?? 0;
    const totalCost = spendAgg[0]?.totalCost ?? 0;
    const avgQuality = qualityAgg[0]?.avgQuality ?? null;

    const topPromptIds = topPromptsAgg.map((p) => p._id);

    const [topPromptDocs, topPromptQuality] = await Promise.all([
      Prompt.find({ _id: { $in: topPromptIds } }).select("title"),
      Comparison.aggregate([
        { $match: { userId, promptId: { $in: topPromptIds } } },
        { $project: { promptId: 1, pairAvg: { $avg: ["$scoreA", "$scoreB"] } } },
        { $group: { _id: "$promptId", avgQuality: { $avg: "$pairAvg" } } },
      ]),
    ]);

    const promptTitleById = new Map(
      topPromptDocs.map((p) => [p._id.toString(), p.title])
    );
    const qualityByPromptId = new Map(
      topPromptQuality.map((q) => [q._id.toString(), q.avgQuality])
    );

    const topPrompts = topPromptsAgg.map((p) => ({
      promptId: p._id,
      title: promptTitleById.get(p._id.toString()) || "Untitled prompt",
      runs: p.runs,
      avgQuality: qualityByPromptId.get(p._id.toString()) ?? null,
    }));

    const modelUsageTotal = modelUsageAgg.reduce((sum, m) => sum + m.count, 0);
    const modelUsage = modelUsageAgg.map((m) => ({
      model: m._id,
      count: m.count,
      percentage:
        modelUsageTotal > 0
          ? Number(((m.count / modelUsageTotal) * 100).toFixed(1))
          : 0,
    }));

    const compStats = comparisonAgg[0];
    const comparisonSummary =
      compStats && compStats.total > 0
        ? {
            totalComparisons: compStats.total,
            aWinRate: Number(((compStats.aWins / compStats.total) * 100).toFixed(1)),
            bWinRate: Number(((compStats.bWins / compStats.total) * 100).toFixed(1)),
            tieRate: Number(((compStats.ties / compStats.total) * 100).toFixed(1)),
            avgQualityImprovement: Number(compStats.avgImprovement.toFixed(2)),
          }
        : null;

    const activityPromptIds = [
      ...new Set([
        ...recentRuns.map((r) => r.promptId.toString()),
        ...recentComparisons.map((c) => c.promptId.toString()),
      ]),
    ];
    const activityPrompts = await Prompt.find({
      _id: { $in: activityPromptIds },
    }).select("title");
    const activityTitleById = new Map(
      activityPrompts.map((p) => [p._id.toString(), p.title])
    );

    const runActivity = recentRuns.map((r) => ({
      type: r.type,
      promptTitle: activityTitleById.get(r.promptId.toString()) || "Untitled prompt",
      createdAt: r.createdAt,
    }));

    const compareActivity = recentComparisons.map((c) => ({
      type: "compare",
      promptTitle: activityTitleById.get(c.promptId.toString()) || "Untitled prompt",
      winner: c.winner,
      createdAt: c.createdAt,
    }));

    const recentActivity = [...runActivity, ...compareActivity]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return res.status(200).json({
      range,
      overview: {
        totalRuns,
        totalTokens,
        totalCost,
        avgLatency,
        avgQuality,
      },
      trends: {
        runs: runsTrendAgg.map((d) => ({ date: d._id, count: d.count })),
        cost: costTrendAgg.map((d) => ({ date: d._id, total: d.total })),
        tokens: tokensTrendAgg.map((d) => ({ date: d._id, total: d.total })),
      },
      topPrompts,
      modelUsage,
      comparisonSummary,
      recentActivity,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      message: "Failed to load analytics",
    });
  }
};
