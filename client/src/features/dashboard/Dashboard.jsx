import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import useAuthStore from "../../store/authStore";

import {
  OVERVIEW_STATS,
  RECENT_PROMPTS,
  RECENT_ACTIVITY,
} from "./dashboardData";

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
            {OVERVIEW_STATS.map((stat) => (
              <div className="analytics-card" key={stat.label}>
                <div className="analytics-label">{stat.label}</div>
                <div className="analytics-value">{stat.value}</div>
              </div>
            ))}
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

            <div className="prompt-list">
              {RECENT_PROMPTS.map((prompt) => (
                <div className="prompt-list-item" key={prompt.id}>
                  <div className="prompt-list-main">
                    <span className="prompt-list-name">{prompt.name}</span>
                    <span className="prompt-list-meta">
                      <span className="editor-chip">{prompt.version}</span>
                      Last edited {prompt.editedAgo}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => navigate("/workspace")}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="dashboard-section dashboard-col"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <p className="dashboard-section-label mono">Recent Activity</p>

            <div className="activity-list">
              {RECENT_ACTIVITY.map((item) => (
                <div className="activity-item" key={item.id}>
                  <span className="activity-dot" />
                  <div className="activity-main">
                    <span className="activity-label">{item.label}</span>
                    <span className="activity-detail">{item.detail}</span>
                  </div>
                  <span className="activity-time">{item.timeAgo}</span>
                </div>
              ))}
            </div>
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
