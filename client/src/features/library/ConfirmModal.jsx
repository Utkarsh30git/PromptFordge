import { useState } from "react";
import Button from "../../components/ui/Button";

const ConfirmModal = ({
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="avatar-picker-overlay" onClick={onCancel}>
      <div className="avatar-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-picker-header">
          <p className="avatar-picker-title">{title}</p>
        </div>

        <div className="avatar-picker-body">
          <p className="empty-state-description" style={{ marginBottom: 0 }}>
            {description}
          </p>
        </div>

        <div className="avatar-picker-footer">
          <div className="avatar-picker-actions">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant={danger ? "danger" : "amber"}
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? "Working…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
