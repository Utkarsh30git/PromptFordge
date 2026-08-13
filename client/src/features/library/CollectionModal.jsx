import { useState } from "react";
import Button from "../../components/ui/Button";

const MAX_LENGTH = 100;

// Shared modal for both "New Collection" and "Rename Collection" —
// same fields/validation, just a different title/submit label and
// initial value depending on `mode`.
const CollectionModal = ({ mode = "create", initialName = "", onSubmit, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Collection name is required");
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Name must be ${MAX_LENGTH} characters or fewer`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="avatar-picker-overlay" onClick={onCancel}>
      <div className="avatar-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-picker-header">
          <p className="avatar-picker-title">
            {mode === "create" ? "New Collection" : "Rename Collection"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="avatar-picker-body">
            <div className="settings-field">
              <label className="settings-field-label">Collection name</label>
              <input
                autoFocus
                className="settings-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Career"
                maxLength={MAX_LENGTH}
              />
              {error && <p className="settings-form-error">{error}</p>}
            </div>
          </div>

          <div className="avatar-picker-footer">
            <div className="avatar-picker-actions">
              <Button variant="ghost" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="amber" type="submit" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : mode === "create"
                  ? "Create"
                  : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionModal;
