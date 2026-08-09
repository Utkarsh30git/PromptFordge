import { useState } from "react";
import Button from "../../components/ui/Button";
import {
  COLLECTIONS,
  INITIAL_VERSIONS,
  DEFAULT_PROMPT,
} from "./workspaceData";

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const Workspace = () => {
  const [activeCollection, setActiveCollection] = useState("Interview");
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [activeVersion, setActiveVersion] = useState(
    INITIAL_VERSIONS[INITIAL_VERSIONS.length - 1]
  );

  const [title, setTitle] = useState(DEFAULT_PROMPT.title);
  const [content, setContent] = useState(DEFAULT_PROMPT.content);

  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [metrics, setMetrics] = useState({
    latency: "1.2s",
    latencyPct: 82,
    tokens: 520,
    tokensPct: 70,
    cost: "$0.0011",
    costPct: 45,
  });

  const showStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(showStatus._t);
    showStatus._t = window.setTimeout(() => setStatusMessage(""), 2200);
  };

  const handleRun = () => {
    if (running) return;
    setRunning(true);

    window.setTimeout(() => {
      const tokenCount = Math.max(
        40,
        Math.round(content.split(/\s+/).filter(Boolean).length * 4.2)
      );
      const latency = randomBetween(0.6, 2.1);
      const cost = tokenCount * 0.000002;

      setMetrics({
        latency: `${latency.toFixed(1)}s`,
        latencyPct: Math.min(100, Math.round((latency / 2.5) * 100)),
        tokens: tokenCount,
        tokensPct: Math.min(100, Math.round((tokenCount / 900) * 100)),
        cost: `$${cost.toFixed(4)}`,
        costPct: Math.min(100, Math.round((cost / 0.003) * 100)),
      });

      setRunning(false);
      showStatus("Run complete");
    }, 900);
  };

  const handleSaveVersion = () => {
    const nextIndex = versions.length + 1;
    const nextVersion = `v${nextIndex}`;

    setVersions((prev) => [...prev, nextVersion]);
    setActiveVersion(nextVersion);
    showStatus(`Saved ${nextVersion}`);
  };

  const handleOptimize = () => {
    setContent((prev) => prev.trim());
    showStatus("Optimized");
  };

  return (
    <div className="workspace-page">
      <div className="workspace-shell">
        <div className="workspace-grid">
          {/* Collections */}
          <aside className="collections-panel">
            <div className="panel-title">Collections</div>

            <div className="collection-list">
              {COLLECTIONS.map((item) => (
                <div
                  key={item}
                  className={`collection-item ${
                    item === activeCollection ? "active" : ""
                  }`}
                  onClick={() => setActiveCollection(item)}
                  role="button"
                  tabIndex={0}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          {/* Version Rail */}
          <div className="version-rail">
            <div className="version-title">Versions</div>

            <div className="version-list">
              {versions.map((version, index) => (
                <div className="version-node" key={version}>
                  <span className="version-label">{version}</span>

                  <div
                    className={`version-dot ${
                      version === activeVersion ? "active" : ""
                    }`}
                    onClick={() => setActiveVersion(version)}
                    role="button"
                    tabIndex={0}
                  />

                  {index !== versions.length - 1 && (
                    <div className="version-line" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <main className="editor-panel">
            <div className="editor-header">
              <input
                className="prompt-name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="untitled.prompt"
              />
            </div>

            <div className="editor-body">
              <textarea
                className="prompt-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your prompt..."
              />
            </div>

            <div className="editor-footer">
              <div className="editor-settings">
                <div className="editor-chip">{DEFAULT_PROMPT.model}</div>
                <div className="editor-chip">
                  Temp {DEFAULT_PROMPT.temperature}
                </div>
                <div className="editor-chip">{activeCollection}</div>

                {statusMessage && (
                  <div className="editor-status">{statusMessage}</div>
                )}
              </div>

              <div className="editor-actions">
                <Button variant="ghost" onClick={handleOptimize}>
                  Optimize
                </Button>

                <Button variant="amber" onClick={handleRun} disabled={running}>
                  {running ? "Running…" : "Run →"}
                </Button>

                <Button variant="ghost" onClick={handleSaveVersion}>
                  Save Version
                </Button>
              </div>
            </div>
          </main>

          {/* Metrics Panel */}
          <aside className="metrics-panel">
            <div className="panel-title">Live Metrics</div>

            <div className="metrics-list">
              <div className="metric-card">
                <span className="metric-label">LATENCY</span>
                <strong>{metrics.latency}</strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.latencyPct}%` }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <span className="metric-label">Tokens</span>
                <strong>{metrics.tokens}</strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.tokensPct}%` }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <span className="metric-label">Cost</span>
                <strong>{metrics.cost}</strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.costPct}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
