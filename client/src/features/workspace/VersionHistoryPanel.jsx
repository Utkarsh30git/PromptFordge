import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import useWorkspaceStore from "../../store/workspaceStore";
import useCompareStore from "../../store/compareStore";
import { extractVariables } from "../../utils/promptVariables";

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatRelativeDay = (date) => {
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return "";

  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOf(new Date()) - startOf(then)) / 86_400_000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(date);
};

const buildPreview = (content) => {
  if (!content) return "Empty version.";
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > 90 ? `${flat.slice(0, 90)}…` : flat;
};

const VersionHistoryPanel = () => {
  const navigate = useNavigate();
  const {
    versionHistoryOpen,
    versions,
    versionsLoading,
    error,
    activePromptId,
    restoringVersion,
    restoreError,
    closeVersionHistory,
    restoreVersion,
    selectPrompt,
  } = useWorkspaceStore();

  const [expandedVersionNumber, setExpandedVersionNumber] = useState(null);
  const [confirmingRestore, setConfirmingRestore] = useState(null);

  useEffect(() => {
    if (!versionHistoryOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (confirmingRestore !== null) setConfirmingRestore(null);
        else closeVersionHistory();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [versionHistoryOpen, confirmingRestore, closeVersionHistory]);

  useEffect(() => {
    if (versionHistoryOpen) {
      setExpandedVersionNumber(null);
      setConfirmingRestore(null);
    }
  }, [versionHistoryOpen]);

  if (!versionHistoryOpen) return null;

  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );
  const currentVersionNumber = versions.length
    ? versions[versions.length - 1].versionNumber
    : null;

  const handleCompare = (version) => {
    const currentVersion = versions[versions.length - 1];
    if (!currentVersion || !activePromptId) return;

    useCompareStore.getState().startComparison({
      promptId: activePromptId,
      versionAId: currentVersion._id,
      versionBId: version._id,
    });

    closeVersionHistory();
    navigate("/compare");
  };

  const handleRestore = async (versionNumber) => {
    try {
      await restoreVersion(versionNumber);
      setConfirmingRestore(null);
    } catch {

    }
  };

  return (
    <div
      className="optimize-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeVersionHistory();
      }}
    >
      <div
        className="optimize-modal version-history-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="optimize-modal-header">
          <span className="optimize-modal-title mono">Version History</span>
        </div>

        <div className="version-history-body">
          {versionsLoading && (
            <div className="panel-empty-hint">Loading…</div>
          )}

          {!versionsLoading && error && (
            <div className="version-history-error">
              <p className="empty-state-title">
                Unable to load version history.
              </p>
              <Button
                variant="ghost"
                onClick={() => activePromptId && selectPrompt(activePromptId)}
              >
                Try Again
              </Button>
            </div>
          )}

          {!versionsLoading && !error && sortedVersions.length === 0 && (
            <div className="panel-empty-hint">No versions yet.</div>
          )}

          {!versionsLoading && !error && sortedVersions.length > 0 && (
            <div className="version-history-list">
              {sortedVersions.map((version) => {
                const isCurrent = version.versionNumber === currentVersionNumber;
                const isExpanded = expandedVersionNumber === version.versionNumber;
                const isConfirming = confirmingRestore === version.versionNumber;
                const versionVariables = extractVariables(version.content);

                return (
                  <div
                    className={`version-history-item ${isCurrent ? "current" : ""}`}
                    key={version._id}
                  >
                    <button
                      type="button"
                      className="version-history-item-header"
                      onClick={() =>
                        setExpandedVersionNumber(isExpanded ? null : version.versionNumber)
                      }
                    >
                      <div className="version-history-item-title">
                        <span className="mono">v{version.versionNumber}</span>
                        {isCurrent && (
                          <span className="version-history-current-badge">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className="version-history-item-time">
                        {formatRelativeDay(version.createdAt)}
                      </span>
                    </button>

                    <p className="version-history-item-preview">
                      {buildPreview(version.content)}
                    </p>

                    {isExpanded && (
                      <div className="version-history-preview">
                        <pre className="response-text version-history-preview-content">
                          {version.content || "Empty version."}
                        </pre>

                        {versionVariables.length > 0 && (
                          <div className="version-history-preview-variables">
                            <span className="version-history-preview-variables-label mono">
                              Variables
                            </span>
                            {versionVariables.map((name) => (
                              <span className="editor-chip mono" key={name}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="version-history-preview-created">
                          Created: {formatDate(version.createdAt)}
                        </p>

                        {!isCurrent && !isConfirming && (
                          <div className="version-history-preview-actions">
                            <Button
                              variant="ghost"
                              onClick={() => handleCompare(version)}
                            >
                              Compare
                            </Button>
                            <Button
                              variant="amber"
                              onClick={() => setConfirmingRestore(version.versionNumber)}
                            >
                              Restore Version
                            </Button>
                          </div>
                        )}

                        {!isCurrent && isConfirming && (
                          <div className="version-history-confirm">
                            <p className="version-history-confirm-text">
                              Restore Version {version.versionNumber}? Your
                              current prompt will be restored to this version.
                            </p>
                            {restoreError && (
                              <p className="compare-error-text">{restoreError}</p>
                            )}
                            <div className="version-history-preview-actions">
                              <Button
                                variant="ghost"
                                onClick={() => setConfirmingRestore(null)}
                                disabled={restoringVersion}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="amber"
                                onClick={() => handleRestore(version.versionNumber)}
                                disabled={restoringVersion}
                              >
                                {restoringVersion ? "Restoring…" : "Restore"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="optimize-modal-footer">
          <div className="optimize-modal-actions">
            <Button variant="ghost" onClick={closeVersionHistory}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPanel;
