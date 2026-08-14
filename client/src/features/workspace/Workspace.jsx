import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import ResponseMarkdown from "./ResponseMarkdown";
import OptimizeModal from "./OptimizeModal";
import QualityPanel from "./QualityPanel";
import VersionHistoryPanel from "./VersionHistoryPanel";
import ConfirmModal from "../library/ConfirmModal";
import useWorkspaceStore from "../../store/workspaceStore";
import {
  FolderIcon,
  PlusIcon,
  HistoryIcon,
  ListIcon,
  PencilIcon,
  ExpandIcon,
  KebabIcon,
  BarsIcon,
  BoltIcon,
  PlayIcon,
  BookmarkIcon,
  ClockIcon,
  HashIcon,
  CoinIcon,
  TrashIcon,
} from "./WorkspaceIcons";

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

const clampPct = (value, max) =>
  value === null || value === undefined
    ? 0
    : Math.max(0, Math.min(100, Math.round((value / max) * 100)));

const Workspace = ({ promptId }) => {
  const navigate = useNavigate();
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
    isAnalyzing,
    openVersionHistory,
    fetchCollections,
    createCollection,
    selectCollection,
    createPrompt,
    selectPrompt,
    openPromptDirect,
    setEditorTitle,
    setEditorContent,
    setVariableValue,
    selectVersion,
    saveVersion,
    runPrompt,
    optimizePrompt,
    analyzePrompt,
    deletePrompt,
  } = useWorkspaceStore();

  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showResolvedPreview, setShowResolvedPreview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchCollections();

  }, []);

  useEffect(() => {
    if (promptId) {
      openPromptDirect(promptId);
    }

  }, [promptId]);

  const showStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(showStatus._t);
    showStatus._t = window.setTimeout(() => setStatusMessage(""), 2200);
  };

  useEffect(() => {
    if (error) showStatus(error);

  }, [error]);

  useEffect(() => {
    if (runError) showStatus(runError);

  }, [runError]);

  useEffect(() => {
    if (optimizationError) showStatus(optimizationError);

  }, [optimizationError]);

  useEffect(() => {
    setShowResolvedPreview(false);
  }, [activePromptId]);

  const runStatus = running
    ? "running"
    : runError
    ? "error"
    : response !== null
    ? "complete"
    : "ready";

  const handleRun = async () => {
    if (running || !activePromptId) return;
    try {
      await runPrompt({ model: RUN_MODEL, temperature: RUN_TEMPERATURE });
    } catch {

    }
  };

  const handleOptimize = async () => {
    if (!activePromptId || isOptimizing) return;
    try {
      await optimizePrompt();
    } catch {

    }
  };

  const handleAnalyze = async () => {
    if (!activePromptId || isAnalyzing) return;
    try {
      await analyzePrompt();
    } catch {

    }
  };

  const handleSaveVersion = async () => {
    if (!activePromptId || saving) return;
    try {
      const version = await saveVersion();
      showStatus(`Saved v${version.versionNumber}`);
    } catch {

    }
  };

  const handleNewPrompt = async () => {
    try {
      await createPrompt();
    } catch {

    }
  };

  const handleDeletePrompt = async () => {
    if (!deleteTarget) return;
    try {
      await deletePrompt(deleteTarget.id);
      showStatus("Prompt deleted");
    } catch {

    } finally {
      setDeleteTarget(null);
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

  const showResponsePanel = hasPrompt;

  return (
    <div className="workspace-page page-enter">
      <OptimizeModal />
      <VersionHistoryPanel />

      {deleteTarget && (
        <ConfirmModal
          title="Delete prompt"
          description={`Delete "${deleteTarget.title}" and all of its saved versions? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeletePrompt}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="workspace-shell">
        <div className="workspace-grid">
          {}
          <aside className="collections-panel">
            <div className="panel-header">
              <div className="panel-title">Collections</div>
              <button
                className="panel-add-btn"
                onClick={() => setCreatingCollection(true)}
                title="New collection"
                type="button"
              >
                <PlusIcon />
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
                    <FolderIcon className="collection-item-icon" />
                    <div className="collection-item-body">
                      <span className="collection-item-name">{col.name}</span>
                      {typeof col.promptCount === "number" && (
                        <span className="collection-item-count">
                          {col.promptCount}{" "}
                          {col.promptCount === 1 ? "prompt" : "prompts"}
                        </span>
                      )}
                    </div>
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
                        >
                          <span
                            className="prompt-item-label"
                            onClick={() => selectPrompt(p._id)}
                            role="button"
                            tabIndex={0}
                          >
                            {p.title}
                          </span>
                          <button
                            type="button"
                            className="prompt-item-delete-btn"
                            title="Delete prompt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ id: p._id, title: p.title });
                            }}
                          >
                            <TrashIcon />
                          </button>
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

          {}
          <div className="version-rail">
            <div className="version-rail-header">
              <div className="version-title">Versions</div>
              <button
                type="button"
                className="panel-add-btn"
                onClick={openVersionHistory}
                disabled={!hasPrompt}
                title="Version history"
              >
                <HistoryIcon />
              </button>
            </div>

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

            <button
              type="button"
              className="version-view-all-btn"
              onClick={openVersionHistory}
              disabled={!hasPrompt || versions.length === 0}
            >
              <ListIcon />
              <span>View All</span>
            </button>
          </div>

          {}
          <main className="editor-panel">
            <div className="editor-header">
              <div className="editor-header-title">
                <input
                  className="prompt-name"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="untitled.prompt"
                  disabled={!hasPrompt}
                />
                <PencilIcon className="editor-title-edit-icon" />
              </div>

              <div className="editor-header-actions">
                <button
                  type="button"
                  className="editor-icon-btn"
                  title="Expand"
                  disabled={!hasPrompt}
                >
                  <ExpandIcon />
                </button>
                <button
                  type="button"
                  className="editor-icon-btn"
                  title="More"
                  disabled={!hasPrompt}
                >
                  <KebabIcon />
                </button>
              </div>
            </div>

            <div className="editor-body">
              {hasPrompt ? (
                <textarea
                  key={activePromptId}
                  className="prompt-editor editor-content-enter"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Write your prompt..."
                />
              ) : (
                <div className="editor-empty-state">
                  <div className="editor-empty-pattern" aria-hidden="true" />

                  <h3 className="editor-empty-title">
                    Start building your prompt
                  </h3>

                  <p className="editor-empty-desc">
                    Create, test, and optimize prompts to get better AI
                    responses.
                  </p>

                  <div className="editor-empty-actions">
                    <Button variant="amber" onClick={handleNewPrompt}>
                      Create New Prompt
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/prompts")}>
                      Explore Prompts
                    </Button>
                  </div>
                </div>
              )}
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
                <div className="editor-chip editor-chip-model">
                  <span className="editor-chip-dot" aria-hidden="true" />
                  GPT-4.1
                </div>
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
                  onClick={openVersionHistory}
                  disabled={!hasPrompt}
                >
                  <HistoryIcon className="btn-icon" />
                  Version History
                </Button>

                <Button
                  variant="emerald-ghost"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !hasPrompt}
                >
                  <BarsIcon className="btn-icon" />
                  {isAnalyzing ? "Analyzing…" : "Analyze"}
                </Button>

                <Button
                  variant="cyan-ghost"
                  onClick={handleOptimize}
                  disabled={isOptimizing || !hasPrompt}
                >
                  <BoltIcon className="btn-icon" />
                  {isOptimizing ? "Optimizing…" : "Optimize"}
                </Button>

                <Button
                  variant="amber"
                  onClick={handleRun}
                  disabled={running || !hasPrompt || missingVariables.length > 0}
                >
                  <PlayIcon className="btn-icon" />
                  {running ? "Running…" : "Run"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSaveVersion}
                  disabled={saving || !hasPrompt}
                >
                  <BookmarkIcon className="btn-icon" />
                  {saving ? "Saving…" : "Save Version"}
                </Button>
              </div>
            </div>

            {showResponsePanel && (
              <div className="response-panel">
                <div className="response-panel-header">
                  <span
                    className={`response-status-dot status-${runStatus}`}
                    aria-hidden="true"
                  />
                  <span className="response-panel-title mono">AI OUTPUT</span>

                  {runMeta?.model && runStatus !== "running" && (
                    <span className="response-panel-model mono">
                      {runMeta.model}
                    </span>
                  )}

                  <span className={`response-status-label status-${runStatus}`}>
                    {running
                      ? "Running"
                      : runError
                      ? "Error"
                      : response !== null
                      ? "Complete"
                      : "Ready"}
                  </span>
                </div>

                {runStatus === "ready" && (
                  <div className="response-empty-state">
                    <span className="response-empty-kicker mono">
                      Ready to run
                    </span>
                    <p className="response-empty-desc">
                      Your AI response will appear here.
                    </p>
                  </div>
                )}

                {running && (
                  <div className="response-loading">
                    <span className="response-loading-dot" aria-hidden="true" />
                    Generating response…
                  </div>
                )}

                {!running && runError && (
                  <div className="response-error">
                    <p className="response-error-text">
                      Unable to generate response.
                    </p>
                    <Button variant="ghost" onClick={handleRun}>
                      Try Again
                    </Button>
                  </div>
                )}

                {!running && !runError && response !== null && (
                  <>
                    <div className="response-meta-row mono">
                      {runMeta?.model && (
                        <div className="response-meta-item">
                          <span className="response-meta-label">Model</span>
                          <span className="response-meta-value">
                            {runMeta.model}
                          </span>
                        </div>
                      )}
                      <div className="response-meta-item">
                        <span className="response-meta-label">Latency</span>
                        <span className="response-meta-value">
                          {metrics.latency}
                        </span>
                      </div>
                      <div className="response-meta-item">
                        <span className="response-meta-label">Tokens</span>
                        <span className="response-meta-value">
                          {metrics.tokens}
                        </span>
                      </div>
                      <div className="response-meta-item">
                        <span className="response-meta-label">Cost</span>
                        <span className="response-meta-value">
                          {metrics.cost}
                        </span>
                      </div>
                    </div>

                    <div className="response-panel-body">
                      <ResponseMarkdown text={response} />
                    </div>

                    {resolvedPrompt && (
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
                  </>
                )}
              </div>
            )}

            {hasPrompt && <QualityPanel />}
          </main>

          {}
          <aside className="metrics-panel">
            <div className="panel-header">
              <div className="panel-title">Live Metrics</div>
            </div>

            <div className="metrics-list">
              <div className="metric-card">
                <span className="metric-label">
                  <ClockIcon className="metric-label-icon" />
                  LATENCY
                </span>
                <strong
                  key={`latency-${metrics.latency}`}
                  className={runMeta?.latency == null ? "metric-value-empty" : ""}
                >
                  {metrics.latency}
                </strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.latencyPct}%` }}
                  />
                </div>
                <span className="metric-caption">Avg. response time</span>
              </div>

              <div className="metric-card">
                <span className="metric-label">
                  <HashIcon className="metric-label-icon" />
                  Tokens
                </span>
                <strong
                  key={`tokens-${metrics.tokens}`}
                  className={runMeta?.tokens == null ? "metric-value-empty" : ""}
                >
                  {metrics.tokens}
                </strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.tokensPct}%` }}
                  />
                </div>
                <span className="metric-caption">Input + Output</span>
              </div>

              <div className="metric-card">
                <span className="metric-label">
                  <CoinIcon className="metric-label-icon" />
                  Cost
                </span>
                <strong
                  key={`cost-${metrics.cost}`}
                  className={runMeta?.cost == null ? "metric-value-empty" : ""}
                >
                  {metrics.cost}
                </strong>
                <div className="metric-progress">
                  <div
                    className="metric-fill"
                    style={{ width: `${metrics.costPct}%` }}
                  />
                </div>
                <span className="metric-caption">Est. cost per run</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
