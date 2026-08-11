import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import OptimizeModal from "./OptimizeModal";
import useWorkspaceStore from "../../store/workspaceStore";

const RUN_MODEL = "gpt-4.1";
const RUN_TEMPERATURE = 0.7;

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

// Simple, presentation-only scaling for the existing progress bars —
// doesn't invent metric values, just how "full" each bar looks.
const clampPct = (value, max) =>
  value === null || value === undefined
    ? 0
    : Math.max(0, Math.min(100, Math.round((value / max) * 100)));

const Workspace = () => {
  const {
    collections,
    collectionsLoading,
    activeCollectionId,
    prompts,
    promptsLoading,
    activePromptId,
    activePrompt,
    versions,
    viewingVersionNumber,
    editorTitle,
    editorContent,
    saving,
    error,
    running,
    runError,
    response,
    runMeta,
    variables,
    variableValues,
    missingVariables,
    resolvedPrompt,
    isOptimizing,
    optimizationError,
    fetchCollections,
    createCollection,
    selectCollection,
    createPrompt,
    selectPrompt,
    setEditorTitle,
    setEditorContent,
    setVariableValue,
    selectVersion,
    saveVersion,
    runPrompt,
    optimizePrompt,
  } = useWorkspaceStore();

  // Local, UI-only state — unrelated to persistence.
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showResolvedPreview, setShowResolvedPreview] = useState(false);

  useEffect(() => {
    fetchCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(showStatus._t);
    showStatus._t = window.setTimeout(() => setStatusMessage(""), 2200);
  };

  useEffect(() => {
    if (error) showStatus(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (runError) showStatus(runError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runError]);

  useEffect(() => {
    if (optimizationError) showStatus(optimizationError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimizationError]);

  // A resolved-prompt preview from a previous run shouldn't linger
  // once the user has switched to a different prompt.
  useEffect(() => {
    setShowResolvedPreview(false);
  }, [activePromptId]);

  const handleRun = async () => {
    if (running || !activePromptId) return;
    try {
      await runPrompt({ model: RUN_MODEL, temperature: RUN_TEMPERATURE });
    } catch {
      // runError is already set on the store and surfaced above
    }
  };

  const handleOptimize = async () => {
    if (!activePromptId || isOptimizing) return;
    try {
      await optimizePrompt();
    } catch {
      // optimizationError is already set on the store and surfaced above
    }
  };

  const handleSaveVersion = async () => {
    if (!activePromptId || saving) return;
    try {
      const version = await saveVersion();
      showStatus(`Saved v${version.versionNumber}`);
    } catch {
      // store already records the error; showStatus picks it up via effect
    }
  };

  const handleNewPrompt = async () => {
    try {
      await createPrompt();
    } catch {
      // handled by store's error state
    }
  };

  const commitNewCollection = async () => {
    const name = newCollectionName.trim();
    setCreatingCollection(false);
    setNewCollectionName("");
    if (!name) return;

    try {
      await createCollection(name);
    } catch {
      // handled by store's error state
    }
  };

  const cancelNewCollection = () => {
    setCreatingCollection(false);
    setNewCollectionName("");
  };

  const hasPrompt = Boolean(activePromptId);
  const hasUnsavedChanges =
    hasPrompt && activePrompt && editorContent !== activePrompt.content;

  const metrics = {
    latency: formatLatency(runMeta?.latency),
    latencyPct: clampPct(runMeta?.latency, 2500),
    tokens: formatTokens(runMeta?.tokens),
    tokensPct: clampPct(runMeta?.tokens, 900),
    cost: formatCost(runMeta?.cost),
    costPct: clampPct(runMeta?.cost, 0.01),
  };

  const showResponsePanel = running || response !== null || runError;

  return (
    <div className="workspace-page">
      <OptimizeModal />

      <div className="workspace-shell">
        <div className="workspace-grid">
          {/* Collections */}
          <aside className="collections-panel">
            <div className="panel-header">
              <div className="panel-title">Collections</div>
              <button
                className="panel-add-btn"
                onClick={() => setCreatingCollection(true)}
                title="New collection"
                type="button"
              >
                +
              </button>
            </div>

            <div className="collection-list">
              {collectionsLoading && (
                <div className="panel-empty-hint">Loading…</div>
              )}

              {!collectionsLoading &&
                collections.length === 0 &&
                !creatingCollection && (
                  <div className="panel-empty-hint">No collections yet</div>
                )}

              {collections.map((col) => (
                <div key={col._id}>
                  <div
                    className={`collection-item ${
                      col._id === activeCollectionId ? "active" : ""
                    }`}
                    onClick={() => selectCollection(col._id)}
                    role="button"
                    tabIndex={0}
                  >
                    {col.name}
                  </div>

                  {col._id === activeCollectionId && (
                    <div className="prompt-sublist">
                      {promptsLoading && (
                        <div className="panel-empty-hint small">
                          Loading…
                        </div>
                      )}

                      {!promptsLoading &&
                        prompts.length === 0 && (
                          <div className="panel-empty-hint small">
                            No prompts yet
                          </div>
                        )}

                      {prompts.map((p) => (
                        <div
                          key={p._id}
                          className={`prompt-item ${
                            p._id === activePromptId ? "active" : ""
                          }`}
                          onClick={() => selectPrompt(p._id)}
                          role="button"
                          tabIndex={0}
                        >
                          {p.title}
                        </div>
                      ))}

                      <div
                        className="prompt-item prompt-item-add"
                        onClick={handleNewPrompt}
                        role="button"
                        tabIndex={0}
                      >
                        + New Prompt
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {creatingCollection && (
                <input
                  autoFocus
                  className="collection-item-input"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onBlur={commitNewCollection}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitNewCollection();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelNewCollection();
                    }
                  }}
                  placeholder="Collection name"
                />
              )}
            </div>
          </aside>

          {/* Version Rail */}
          <div className="version-rail">
            <div className="version-title">Versions</div>

            <div className="version-list">
              {versions.length === 0 && (
                <div className="panel-empty-hint small vertical">
                  No versions yet
                </div>
              )}

              {versions.map((version, index) => (
                <div className="version-node" key={version.versionNumber}>
                  <span className="version-label">
                    v{version.versionNumber}
                  </span>

                  <div
                    className={`version-dot ${
                      version.versionNumber === viewingVersionNumber
                        ? "active"
                        : ""
                    }`}
                    onClick={() => selectVersion(version.versionNumber)}
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
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="untitled.prompt"
                disabled={!hasPrompt}
              />
            </div>

            <div className="editor-body">
              <textarea
                className="prompt-editor"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={
                  hasPrompt
                    ? "Write your prompt..."
                    : "Select or create a prompt to get started."
                }
                disabled={!hasPrompt}
              />
            </div>

            {hasPrompt && variables.length > 0 && (
              <div className="variables-panel">
                <div className="variables-panel-title mono">Variables</div>

                <div className="variables-list">
                  {variables.map((name) => (
                    <div className="variable-field" key={name}>
                      <label className="variable-field-label mono">
                        {name}
                      </label>
                      <input
                        className={`variable-field-input ${
                          missingVariables.includes(name)
                            ? "variable-field-input-missing"
                            : ""
                        }`}
                        value={variableValues[name] || ""}
                        onChange={(e) => setVariableValue(name, e.target.value)}
                        placeholder="Enter value..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="editor-footer">
              <div className="editor-settings">
                <div className="editor-chip">GPT-4.1</div>
                <div className="editor-chip">Temp 0.7</div>

                {viewingVersionNumber &&
                  versions.length > 0 &&
                  viewingVersionNumber !==
                    versions[versions.length - 1]?.versionNumber && (
                    <div className="editor-chip">
                      Viewing v{viewingVersionNumber}
                    </div>
                  )}

                {hasUnsavedChanges && (
                  <div className="editor-chip">
                    Unsaved changes — Run uses the last saved version
                  </div>
                )}

                {statusMessage && (
                  <div className="editor-status">{statusMessage}</div>
                )}
              </div>

              <div className="editor-actions">
                <Button
                  variant="ghost"
                  onClick={handleOptimize}
                  disabled={isOptimizing || !hasPrompt}
                >
                  {isOptimizing ? "Optimizing…" : "Optimize"}
                </Button>

                <Button
                  variant="amber"
                  onClick={handleRun}
                  disabled={running || !hasPrompt || missingVariables.length > 0}
                >
                  {running ? "Running…" : "Run →"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSaveVersion}
                  disabled={saving || !hasPrompt}
                >
                  {saving ? "Saving…" : "Save Version"}
                </Button>
              </div>
            </div>

            {showResponsePanel && (
              <div className="response-panel">
                <div className="response-panel-header">
                  <span className="response-panel-title mono">Response</span>

                  {runMeta?.model && !running && (
                    <span className="editor-chip">{runMeta.model}</span>
                  )}
                </div>

                <div className="response-panel-body">
                  {running && (
                    <div className="response-loading">
                      Generating response…
                    </div>
                  )}

                  {!running && runError && (
                    <div className="response-error">{runError}</div>
                  )}

                  {!running && !runError && response !== null && (
                    <pre className="response-text">{response}</pre>
                  )}
                </div>

                {!running && !runError && response !== null && resolvedPrompt && (
                  <div className="resolved-prompt-toggle">
                    <button
                      type="button"
                      className="resolved-prompt-toggle-btn mono"
                      onClick={() => setShowResolvedPreview((v) => !v)}
                    >
                      {showResolvedPreview ? "Hide" : "View"} resolved prompt
                    </button>

                    {showResolvedPreview && (
                      <pre className="response-text resolved-prompt-text">
                        {resolvedPrompt}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
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
