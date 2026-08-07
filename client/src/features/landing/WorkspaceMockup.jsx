import Button from "../../components/ui/Button";

const collections = [
  "Frontend",
  "Backend",
  "Marketing",
  "Resume",
  "Interview",
  "Research",
];

const versions = [
  { id: "v4", active: true },
  { id: "v3", active: false },
  { id: "v2", active: false },
  { id: "v1", active: false },
];

const WorkspaceMockup = () => {
  return (
    <div className="workspace-mockup">
      <div className="workspace-grid">
        {/* Collections */}

        <aside className="collections-panel">
          <div className="panel-title">Collections</div>

          <div className="collection-list">
            {collections.map((item) => (
              <div
                key={item}
                className={`collection-item ${
                  item === "Interview" ? "active" : ""
                }`}
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
              <div className="version-node" key={version.id}>
                <span className="version-label">{version.id}</span>

                <div
                  className={`version-dot ${version.active ? "active" : ""}`}
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
              placeholder="interview-question.prompt"
            />
          </div>

          <div className="editor-body">
            <div className="editor-code">
              <div className="line-number">1.</div>

              <div className="line-content">
                Write an interview question for a senior React developer...
              </div>

              <div className="line-number">2.</div>

              <div className="line-content">
                Include one follow-up question about performance optimization.
              </div>

              <div className="line-number">3.</div>

              <div className="line-content cursor">
                End with evaluation criteria.
              </div>
            </div>
          </div>

          <div className="editor-footer">
            <div className="editor-settings">
              <div className="editor-chip">GPT-4.1</div>

              <div className="editor-chip">Temp 0.7</div>
            </div>

            <div className="editor-actions">
              <Button variant="ghost">Optimize</Button>

              <Button variant="amber">Run →</Button>

              <Button variant="ghost">Save Version</Button>
            </div>
          </div>
        </main>

        {/* Metrics Panel */}

        <aside className="metrics-panel">
          <div className="panel-title">Live Metrics</div>

          <div className="metrics-list">
            <div className="metric-card">
              <span className="metric-label">LATENCY</span>

              <strong>1.2s</strong>

              <div className="metric-progress">
                <div className="metric-fill" style={{ width: "82%" }} />
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Tokens</span>

              <strong>520</strong>

              <div className="metric-progress">
                <div className="metric-fill" style={{ width: "70%" }} />
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-label">Cost</span>

              <strong>$0.0011</strong>

              <div className="metric-progress">
                <div className="metric-fill" style={{ width: "45%" }} />
              </div>
            </div>

            
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WorkspaceMockup;
