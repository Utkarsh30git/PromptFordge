import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import EmptyState from "../components/ui/EmptyState";
import TrendChart from "../features/analytics/TrendChart";
import useAnalyticsStore from "../store/analyticsStore";
import { formatRelativeTime } from "../utils/relativeTime";

const RANGES = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "all", label: "ALL" },
];

const formatLatency = (ms) => {
  if (ms === null || ms === undefined) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
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
  return `${score.toFixed(1)} / 10`;
};

const ACTIVITY_LABELS = {
  run: "Prompt executed",
  optimize: "Prompt optimized",
  compare: "Comparison completed",
};

const Analytics = () => {
  const { range, data, loading, error, setRange, fetchAnalytics } =
    useAnalyticsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overview = data?.overview;
  const hasAnyData =
    overview && (overview.totalRuns > 0 || overview.totalCost > 0 || data.comparisonSummary);

  return (
    <div className="app-page">
      <Container>
        <div className="analytics-page-header">
          <div className="section-heading app-page-heading">
            <p className="section-kicker mono">ANALYTICS</p>
            <h1 className="section-title">Understand your prompt performance</h1>
          </div>

          <div className="range-selector">
            {RANGES.map((r) => (
              <button
                key={r.id}
                className={`range-btn ${range === r.id ? "active" : ""}`}
                onClick={() => setRange(r.id)}
                disabled={loading}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !data && (
          <p className="panel-empty-hint">Loading analytics…</p>
        )}

        {error && <p className="compare-error-text">{error}</p>}

        {data && !hasAnyData && (
          <EmptyState
            kicker="No analytics yet"
            title="Run your first prompt to start tracking performance"
            description="Once you run, optimize, or compare prompts in the Workspace, real usage, cost, and quality data will show up here."
            ctaLabel="Open Workspace"
            ctaTo="/workspace"
          />
        )}

        {data && hasAnyData && (
          <>
            {/* Overview */}
            <div className="analytics-overview-grid">
              <div className="analytics-card">
                <div className="analytics-label">Total Runs</div>
                <div className="analytics-value">{overview.totalRuns}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Total Tokens</div>
                <div className="analytics-value">
                  {formatTokens(overview.totalTokens)}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Total Cost</div>
                <div className="analytics-value">
                  {formatCost(overview.totalCost)}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Avg Latency</div>
                <div className="analytics-value">
                  {formatLatency(overview.avgLatency)}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Avg Quality</div>
                <div className="analytics-value">
                  {formatScore(overview.avgQuality)}
                </div>
              </div>
            </div>

            {/* Runs over time */}
            <section className="analytics-section-block">
              <p className="dashboard-section-label mono">Runs Over Time</p>
              <TrendChart
                data={data.trends.runs.map((d) => ({ date: d.date, value: d.count }))}
                color="var(--teal)"
                valueFormatter={(v) => `${v} run${v === 1 ? "" : "s"}`}
              />
            </section>

            {/* Cost + Tokens over time */}
            <div className="analytics-columns">
              <section className="analytics-section-block">
                <p className="dashboard-section-label mono">Cost Over Time</p>
                <TrendChart
                  data={data.trends.cost.map((d) => ({ date: d.date, value: d.total || 0 }))}
                  color="var(--amber)"
                  valueFormatter={formatCost}
                />
              </section>

              <section className="analytics-section-block">
                <p className="dashboard-section-label mono">Token Usage</p>
                <TrendChart
                  data={data.trends.tokens.map((d) => ({ date: d.date, value: d.total || 0 }))}
                  color="var(--teal)"
                  valueFormatter={formatTokens}
                />
              </section>
            </div>

            {/* Top prompts */}
            <section className="analytics-section-block">
              <p className="dashboard-section-label mono">Top Prompts</p>

              {data.topPrompts.length === 0 ? (
                <p className="panel-empty-hint">
                  Run a prompt in the Workspace to see it here.
                </p>
              ) : (
                <div className="prompt-list">
                  {data.topPrompts.map((p) => (
                    <div className="prompt-list-item" key={p.promptId}>
                      <div className="prompt-list-main">
                        <span className="prompt-list-name">{p.title}</span>
                        <span className="prompt-list-meta">
                          {p.runs} run{p.runs === 1 ? "" : "s"}
                        </span>
                      </div>
                      <span className="top-prompt-quality">
                        {formatScore(p.avgQuality)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Model usage + comparison summary */}
            <div className="analytics-columns">
              <section className="analytics-section-block">
                <p className="dashboard-section-label mono">Model Usage</p>

                <div className="model-usage-list">
                  {data.modelUsage.map((m) => (
                    <div className="model-usage-row" key={m.model}>
                      <div className="model-usage-top">
                        <span>{m.model}</span>
                        <span>{m.percentage}%</span>
                      </div>
                      <div className="model-usage-bar">
                        <div
                          className="model-usage-fill"
                          style={{ width: `${m.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section-block">
                <p className="dashboard-section-label mono">Comparisons</p>

                {!data.comparisonSummary ? (
                  <p className="panel-empty-hint">
                    Compare two versions in the Workspace to see results here.
                  </p>
                ) : (
                  <div className="comparison-summary-grid">
                    <div className="comparison-stat">
                      <span className="comparison-stat-label">Comparisons</span>
                      <strong>{data.comparisonSummary.totalComparisons}</strong>
                    </div>
                    <div className="comparison-stat">
                      <span className="comparison-stat-label">Prompt A wins</span>
                      <strong>{data.comparisonSummary.aWinRate}%</strong>
                    </div>
                    <div className="comparison-stat">
                      <span className="comparison-stat-label">Prompt B wins</span>
                      <strong>{data.comparisonSummary.bWinRate}%</strong>
                    </div>
                    <div className="comparison-stat">
                      <span className="comparison-stat-label">Quality gap</span>
                      <strong>+{data.comparisonSummary.avgQualityImprovement}</strong>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Recent activity */}
            <section className="analytics-section-block">
              <p className="dashboard-section-label mono">Recent Activity</p>

              {data.recentActivity.length === 0 ? (
                <p className="panel-empty-hint">Nothing here yet.</p>
              ) : (
                <div className="activity-list">
                  {data.recentActivity.map((item, i) => (
                    <div className="activity-item" key={i}>
                      <span className="activity-dot" />
                      <div className="activity-main">
                        <span className="activity-label">
                          {ACTIVITY_LABELS[item.type] || item.type}
                        </span>
                        <span className="activity-detail">
                          {item.promptTitle}
                          {item.type === "compare" && item.winner
                            ? ` · Winner: ${item.winner === "tie" ? "Tie" : `Prompt ${item.winner}`}`
                            : ""}
                        </span>
                      </div>
                      <span className="activity-time">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </Container>
    </div>
  );
};

export default Analytics;
