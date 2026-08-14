import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import ConfirmModal from "./ConfirmModal";
import { formatRelativeTime } from "../../utils/relativeTime";

const buildPreview = (content) => {
  if (!content) return "No content yet.";

  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > 110 ? `${flat.slice(0, 110)}…` : flat;
};

const PromptCard = ({ prompt, collections, onToggleFavorite, onMove, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const collectionName = prompt.collectionId
    ? collections.find((c) => c._id === prompt.collectionId)?.name || "Collection"
    : "No Collection";

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(prompt._id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="prompt-card">
      <div className="prompt-card-top">
        <h3 className="prompt-card-title">{prompt.title}</h3>

        <button
          type="button"
          className={`prompt-card-fav ${prompt.isFavorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(prompt._id)}
          title={prompt.isFavorite ? "Unfavorite" : "Favorite"}
          aria-label={prompt.isFavorite ? "Unfavorite" : "Favorite"}
        >
          {prompt.isFavorite ? "★" : "☆"}
        </button>
      </div>

      <p className="prompt-card-preview">{buildPreview(prompt.content)}</p>

      <div className="prompt-card-meta">
        <span className="prompt-card-chip">{collectionName}</span>
        {prompt.latestVersionNumber && (
          <span className="prompt-card-chip mono">v{prompt.latestVersionNumber}</span>
        )}
        <span className="prompt-card-updated">
          Updated {formatRelativeTime(prompt.updatedAt)}
        </span>
      </div>

      <div className="prompt-card-footer">
        <div className="prompt-card-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="prompt-card-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Prompt options"
          >
            •••
          </button>

          {menuOpen && (
            <div className="prompt-card-menu">
              <div className="prompt-card-menu-label">Move to collection</div>
              <button
                type="button"
                className="prompt-card-menu-item"
                onClick={() => {
                  onMove(prompt._id, null);
                  setMenuOpen(false);
                }}
              >
                No Collection
              </button>
              {collections.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="prompt-card-menu-item"
                  onClick={() => {
                    onMove(prompt._id, c._id);
                    setMenuOpen(false);
                  }}
                >
                  {c.name}
                </button>
              ))}

              {onDelete && (
                <>
                  <div className="prompt-card-menu-divider" />
                  <button
                    type="button"
                    className="prompt-card-menu-item prompt-card-menu-item-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingDelete(true);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={() => navigate(`/prompts/${prompt._id}`)}>
          Open
        </Button>
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete prompt"
          description={`Delete "${prompt.title}" and all of its saved versions? This can't be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
};

export default PromptCard;
