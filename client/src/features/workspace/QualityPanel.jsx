import Button from "../../components/ui/Button";
import useWorkspaceStore from "../../store/workspaceStore";

const DIMENSION_LABELS = {
  clarity: "Clarity",
  specificity: "Specificity",
  context: "Context",
  structure: "Structure",
  outputDefinition: "Output Definition",
};

const DIMENSION_ORDER = [
  "clarity",
  "specificity",
  "context",
  "structure",
  "outputDefinition",
];

const scoreTone = (value) => {
  if (value >= 7) return "strong";
  if (value >= 4) return "medium";
  return "low";
};

const QualityPanel = () => {
  const {
    activePromptId,
    isAnalyzing,
    analysisError,
    qualityAnalysis,
    analyzePrompt,
    isOptimizing,
    optimizePrompt,
  } = useWorkspaceStore();

  const hasPrompt = Boolean(activePromptId);

  const handleAnalyze = async () => {
    if (!hasPrompt || isAnalyzing) return;
    try {
      await analyzePrompt();
    } catch {

    }
  };

  const handleOptimize = async () => {
    if (!hasPrompt || isOptimizing) return;
    try {
      await optimizePrompt();
    } catch {

    }
  };

  return (
    <div className="quality-panel">
      <div className="quality-panel-header">
        <span className="quality-panel-title mono">Prompt Quality</span>

        {qualityAnalysis && !isAnalyzing && (
          <button
            type="button"
            className="quality-reanalyze-btn"
            onClick={handleAnalyze}
            disabled={!hasPrompt}
          >
            Re-analyze
          </button>
        )}
      </div>

      {isAnalyzing && (
        <div className="quality-loading">Analyzing…</div>
      )}

      {!isAnalyzing && analysisError && (
        <div className="quality-error-state">
          <p className="quality-error-message">
            Unable to analyze this prompt right now.
          </p>
          <Button variant="ghost" onClick={handleAnalyze} disabled={!hasPrompt}>
            Try Again
          </Button>
        </div>
      )}

      {!isAnalyzing && !analysisError && !qualityAnalysis && (
        <div className="quality-empty-state">
          <p className="quality-empty-message">
            Not analyzed yet. Analyze your prompt to see how clear, specific,
            and well structured it is.
          </p>
          <Button
            variant="emerald-ghost"
            onClick={handleAnalyze}
            disabled={!hasPrompt}
          >
            Analyze Prompt
          </Button>
        </div>
      )}

      {!isAnalyzing && !analysisError && qualityAnalysis && (
        <>
          <div className="quality-overall">
            <span className="quality-overall-label mono">Overall</span>
            <span
              className={`quality-overall-score quality-tone-${scoreTone(
                qualityAnalysis.overallScore
              )}`}
            >
              {qualityAnalysis.overallScore.toFixed(1)}
              <span className="quality-overall-max">/10</span>
            </span>
          </div>

          <div className="quality-dims">
            {DIMENSION_ORDER.map((dim) => {
              const value = qualityAnalysis.scores[dim];
              return (
                <div className="quality-dim-row" key={dim}>
                  <span className="quality-dim-label">
                    {DIMENSION_LABELS[dim]}
                  </span>
                  <div className="quality-dim-bar">
                    <div
                      className={`quality-dim-fill quality-tone-bg-${scoreTone(
                        value
                      )}`}
                      style={{ width: `${(value / 10) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`quality-dim-value quality-tone-${scoreTone(
                      value
                    )}`}
                  >
                    {value.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {qualityAnalysis.summary && (
            <div className="quality-summary">
              <div className="quality-section-label mono">Summary</div>
              <p className="quality-summary-text">{qualityAnalysis.summary}</p>
            </div>
          )}

          {qualityAnalysis.suggestions?.length > 0 && (
            <div className="quality-suggestions">
              <div className="quality-section-label mono">Suggestions</div>
              <ul className="quality-suggestions-list">
                {qualityAnalysis.suggestions.map((s, i) => (
                  <li key={i}>{s.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="quality-panel-actions">
            <Button
              variant="amber"
              onClick={handleOptimize}
              disabled={!hasPrompt || isOptimizing}
            >
              {isOptimizing ? "Optimizing…" : "Optimize Prompt"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default QualityPanel;
