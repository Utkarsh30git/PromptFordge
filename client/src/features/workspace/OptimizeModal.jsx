import { useEffect } from "react";
import Button from "../../components/ui/Button";
import useWorkspaceStore from "../../store/workspaceStore";

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

// Self-contained review panel for "Optimize": shown only once an
// optimized prompt has come back from the backend. Nothing here
// touches the database — it only decides what happens to the local
// editor content ("Use Optimized Prompt") or discards the result
// ("Cancel"). Saving a version is still a separate, explicit step.
const OptimizeModal = () => {
  const {
    optimizationModalOpen,
    optimizedPrompt,
    optimizationMetrics,
    editorContent,
    cancelOptimize,
    useOptimizedPrompt,
  } = useWorkspaceStore();

  useEffect(() => {
    if (!optimizationModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") cancelOptimize();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [optimizationModalOpen, cancelOptimize]);

  if (!optimizationModalOpen || optimizedPrompt === null) return null;

  return (
    <div
      className="optimize-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancelOptimize();
      }}
    >
      <div className="optimize-modal" role="dialog" aria-modal="true">
        <div className="optimize-modal-header">
          <span className="optimize-modal-title mono">
            Review Optimized Prompt
          </span>
        </div>

        <div className="optimize-columns">
          <div className="optimize-column">
            <div className="optimize-column-label">Current Prompt</div>
            <pre className="optimize-column-content">{editorContent}</pre>
          </div>

          <div className="optimize-column">
            <div className="optimize-column-label optimize-column-label-highlight">
              Optimized Prompt
            </div>
            <pre className="optimize-column-content optimize-column-content-highlight">
              {optimizedPrompt}
            </pre>
          </div>
        </div>

        <div className="optimize-modal-footer">
          <div className="optimize-modal-meta">
            <span>
              Latency <strong>{formatLatency(optimizationMetrics?.latency)}</strong>
            </span>
            <span>
              Tokens <strong>{formatTokens(optimizationMetrics?.tokens)}</strong>
            </span>
            <span>
              Cost <strong>{formatCost(optimizationMetrics?.cost)}</strong>
            </span>
          </div>

          <div className="optimize-modal-actions">
            <Button variant="ghost" onClick={cancelOptimize}>
              Cancel
            </Button>
            <Button variant="amber" onClick={useOptimizedPrompt}>
              Use Optimized Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeModal;
