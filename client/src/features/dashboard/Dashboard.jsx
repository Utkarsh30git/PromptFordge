import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import useAuthStore from "../../store/authStore";
import * as analyticsApi from "../../services/analyticsApi";
import * as promptsApi from "../../services/promptsApi";
import { formatRelativeTime } from "../../utils/relativeTime";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatTokens = (tokens) => {
  if (tokens === null || tokens === undefined) return "—";
  return tokens.toLocaleString();
};

const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "—";
  return `$${cost.toFixed(4)}`;
};

const formatScore = (score) => {
  if (score === null || score === undefined) return "—";
  return score.toFixed(1);
};

const ACTIVITY_LABELS = {
  run: "Prompt executed",
  optimize: "Prompt optimized",
  compare: "Comparison completed",
};

const QUICK_ACTIONS = [
  {
    id: "create",
    title: "Create Prompt",
    description: "Start a new prompt from scratch in the Workspace.",
    to: "/workspace",
  },
  {
    id: "workspace",
    title: "Open Workspace",
    description: "Jump back into your prompt editor.",
    to: "/workspace",
  },
  {
    id: "compare",
    title: "Compare Versions",
    description: "See how two prompt versions stack up.",
    to: "/compare",
  },
  {
    id: "analytics",
    title: "View Analytics",
    description: "Track runs, cost, and quality over time.",
    to: "/analytics",
  },
];

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const firstName = user?.name?.split(" ")[0] || "there";

  // Reuses the same analytics aggregation and API client the
  // Analytics page uses — a fixed 30-day snapshot, independent of
  // whatever time range the user may have selected on that page.
  const [overview, setOverview] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [analytics, prompts] = await Promise.all([
          analyticsApi.getAnalytics("30d"),
          promptsApi.listPrompts(),
        ]);

        if (cancelled) return;

        setOverview(analytics.overview);
        setRecentActivity(analytics.recentActivity.slice(0, 4));
        setRecentPrompts(prompts.slice(0, 3));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <Container>
        {/* Header */}
        <motion.div
          className="dashboard-header"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div>
            <p className="dashboard-kicker mono">PROMPTFORGE DASHBOARD</p>
            <h1 className="dashboard-title">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening with your prompts.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Button variant="ghost" onClick={() => navigate("/workspace")}>
              Open Workspace
            </Button>
            <Button variant="amber" onClick={() => navigate("/workspace")}>
              New Prompt
            </Button>
          </div>
        </motion.div>

        {/* Overview */}
        <motion.section
          className="dashboard-section"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
        >
          <p className="dashboard-section-label mono">Overview</p>

          <div className="dashboard-stats-grid">
            <div className="analytics-card">
              <div className="analytics-label">Total Runs</div>
              <div className="analytics-value">
                {loading ? "—" : overview?.totalRuns ?? 0}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Tokens Used</div>
              <div className="analytics-value">
                {loading ? "—" : formatTokens(overview?.totalTokens)}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Estimated Cost</div>
              <div className="analytics-value">
                {loading ? "—" : formatCost(overview?.totalCost)}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Avg Score</div>
              <div className="analytics-value">
                {loading ? "—" : formatScore(overview?.avgQuality)}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Recent prompts + activity */}
        <div className="dashboard-columns">
          <motion.section
            className="dashboard-section dashboard-col"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <p className="dashboard-section-label mono">Recent Prompts</p>

            {!loading && recentPrompts.length === 0 && (
              <p className="panel-empty-hint">
                No prompts yet — create one in the Workspace.
              </p>
            )}

            {recentPrompts.length > 0 && (
              <div className="prompt-list">
                {recentPrompts.map((prompt) => (
                  <div className="prompt-list-item" key={prompt._id}>
                    <div className="prompt-list-main">
                      <span className="prompt-list-name">{prompt.title}</span>
                      <span className="prompt-list-meta">
                        Last edited {formatRelativeTime(prompt.updatedAt)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/prompts/${prompt._id}`)}
                    >
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section
            className="dashboard-section dashboard-col"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <p className="dashboard-section-label mono">Recent Activity</p>

            {!loading && recentActivity.length === 0 && (
              <p className="panel-empty-hint">
                Run, optimize, or compare a prompt to see activity here.
              </p>
            )}

            {recentActivity.length > 0 && (
              <div className="activity-list">
                {recentActivity.map((item, i) => (
                  <div className="activity-item" key={i}>
                    <span className="activity-dot" />
                    <div className="activity-main">
                      <span className="activity-label">
                        {ACTIVITY_LABELS[item.type] || item.type}
                      </span>
                      <span className="activity-detail">
                        {item.promptTitle}
                      </span>
                    </div>
                    <span className="activity-time">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Quick actions */}
        <motion.section
          className="dashboard-section"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
        >
          <p className="dashboard-section-label mono">Quick Actions</p>

          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                className="quick-action-card"
                onClick={() => navigate(action.to)}
              >
                <span className="quick-action-title">{action.title}</span>
                <span className="quick-action-description">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </motion.section>
      </Container>
    </div>
  );
};

export default Dashboard;
