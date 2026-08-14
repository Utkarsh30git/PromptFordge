import { useEffect } from "react";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import SelectDropdown from "../components/ui/SelectDropdown";
import useCompareStore from "../store/compareStore";

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

const ResultSide = ({ label, side, isWinner }) => (
  <div className={`compare-result-card ${isWinner ? "winner" : ""}`}>
    <div className="compare-result-header">
      <span className="compare-result-label">{label}</span>
      <span className="editor-chip">v{side.versionNumber}</span>
      {isWinner && <span className="compare-winner-tag">Winner</span>}
    </div>

    <div className="compare-response-body">
      <pre className="response-text">{side.response}</pre>
    </div>

    <div className="compare-metrics-row">
      <div className="compare-metric">
        <span className="compare-metric-label">Latency</span>
        <strong>{formatLatency(side.latency)}</strong>
      </div>
      <div className="compare-metric">
        <span className="compare-metric-label">Tokens</span>
        <strong>{formatTokens(side.tokens)}</strong>
      </div>
      <div className="compare-metric">
        <span className="compare-metric-label">Cost</span>
        <strong>{formatCost(side.cost)}</strong>
      </div>
      <div className="compare-metric">
        <span className="compare-metric-label">Quality</span>
        <strong className="compare-metric-quality">
          {formatScore(side.qualityScore)}
        </strong>
      </div>
    </div>
  </div>
);

const Compare = () => {
  const {
    prompts,
    promptsLoading,
    selectedPromptId,
    versions,
    versionsLoading,
    versionAId,
    versionBId,
    variables,
    variableValues,
    missingVariables,
    testInput,
    comparing,
    compareError,
    result,
    fetchPrompts,
    selectPrompt,
    setVersionA,
    setVersionB,
    setVariableValue,
    setTestInput,
    runCompare,
  } = useCompareStore();

  useEffect(() => {
    fetchPrompts();

  }, []);

  const versionsOptionsFor = (excludeId) =>
    versions.filter((v) => v._id !== excludeId);

  const promptOptions = prompts.map((p) => ({ id: p._id, label: p.title }));
  const versionOptionsFor = (excludeId) =>
    versionsOptionsFor(excludeId).map((v) => ({
      id: v._id,
      label: `v${v.versionNumber}`,
    }));

  const hasEnoughVersions = versions.length >= 2;
  const sameVersionSelected =
    versionAId && versionBId && versionAId === versionBId;

  const canCompare =
    !comparing &&
    selectedPromptId &&
    versionAId &&
    versionBId &&
    !sameVersionSelected &&
    testInput.trim().length > 0 &&
    missingVariables.length === 0;

  const handleCompare = async () => {
    try {
      await runCompare();
    } catch {

    }
  };

  const winner = result?.judge?.winner;

  return (
    <div className="app-page page-enter">
      <Container>
        <div className="section-heading app-page-heading">
          <p className="section-kicker mono">COMPARE</p>
          <h1 className="section-title">Put two prompt versions head-to-head</h1>
          <p className="compare-page-subtitle">
            Run the same test input against both and measure which one
            actually performs better.
          </p>
        </div>

        {!promptsLoading && prompts.length === 0 && (
          <EmptyState
            kicker="Get started"
            title="You'll need a saved prompt first"
            description="Compare works on versions of an existing prompt. Create a prompt and save at least two versions in the Workspace, then come back here."
            ctaLabel="Open Workspace"
            ctaTo="/workspace"
          />
        )}

        {(promptsLoading || prompts.length > 0) && (
          <div className="compare-setup">
            <div className="compare-field">
              <label className="compare-field-label">Prompt</label>
              <SelectDropdown
                options={promptOptions}
                value={selectedPromptId}
                onChange={(id) => selectPrompt(id || null)}
                placeholder={
                  promptsLoading ? "Loading prompts…" : "Select a prompt"
                }
                disabled={promptsLoading}
                fullWidth
              />
            </div>

            {selectedPromptId && !versionsLoading && !hasEnoughVersions && (
              <p className="compare-hint">
                This prompt needs at least two saved versions to compare.
                Save another version in the Workspace first.
              </p>
            )}

            {selectedPromptId && hasEnoughVersions && (
              <>
                <div className="compare-field">
                  <label className="compare-field-label">Test input</label>
                  <textarea
                    className="compare-textarea"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Explain React hooks to a beginner in under 200 words."
                  />
                </div>

                <div className="compare-columns">
                  <div className="optimize-column">
                    <div className="optimize-column-label">Prompt A</div>
                    <SelectDropdown
                      options={versionOptionsFor(versionBId)}
                      value={versionAId}
                      onChange={(id) => setVersionA(id || null)}
                      caption="Version"
                      placeholder="Select version"
                      fullWidth
                    />

                    {versionAId && (
                      <pre className="optimize-column-content">
                        {versions.find((v) => v._id === versionAId)?.content}
                      </pre>
                    )}
                  </div>

                  <div className="optimize-column">
                    <div className="optimize-column-label optimize-column-label-highlight">
                      Prompt B
                    </div>
                    <SelectDropdown
                      options={versionOptionsFor(versionAId)}
                      value={versionBId}
                      onChange={(id) => setVersionB(id || null)}
                      caption="Version"
                      placeholder="Select version"
                      fullWidth
                    />

                    {versionBId && (
                      <pre className="optimize-column-content optimize-column-content-highlight">
                        {versions.find((v) => v._id === versionBId)?.content}
                      </pre>
                    )}
                  </div>
                </div>

                {variables.length > 0 && (
                  <div className="compare-field">
                    <label className="compare-field-label">Variables</label>
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
                            onChange={(e) =>
                              setVariableValue(name, e.target.value)
                            }
                            placeholder="Enter value..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="compare-actions">
                  {compareError && (
                    <span className="compare-error-text">{compareError}</span>
                  )}

                  <Button
                    variant="amber"
                    onClick={handleCompare}
                    disabled={!canCompare}
                  >
                    {comparing ? "Comparing…" : "Compare →"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {result && (
          <div className="compare-results">
            <div className="compare-results-grid">
              <ResultSide
                label="Prompt A"
                side={{ ...result.a, qualityScore: result.judge.scoreA }}
                isWinner={winner === "A"}
              />
              <ResultSide
                label="Prompt B"
                side={{ ...result.b, qualityScore: result.judge.scoreB }}
                isWinner={winner === "B"}
              />
            </div>

            <div className="compare-winner-banner">
              <span className="compare-winner-kicker mono">Winner</span>
              <h3 className="compare-winner-title">
                {winner === "tie"
                  ? "Very close"
                  : winner === "A"
                  ? "Prompt A"
                  : "Prompt B"}
              </h3>
              {winner !== "tie" && (
                <p className="compare-winner-score">
                  Quality score:{" "}
                  {formatScore(winner === "A" ? result.judge.scoreA : result.judge.scoreB)}
                </p>
              )}
              {result.judge.reason && (
                <p className="compare-winner-reason">"{result.judge.reason}"</p>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Compare;
