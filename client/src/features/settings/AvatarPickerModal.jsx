import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import PresetAvatar from "../../components/ui/PresetAvatar";
import {
  AVATAR_PRESETS,
  isPresetAvatarId,
  USE_GOOGLE_AVATAR,
} from "../../constants/avatarPresets";

const AvatarPickerModal = ({ open, user, onClose, onSave }) => {
  const initials = user?.name?.charAt(0).toUpperCase() || "?";

  const currentSelection =
    user?.avatar && isPresetAvatarId(user.avatar)
      ? user.avatar
      : user?.googleAvatar && user?.avatar === user.googleAvatar
        ? USE_GOOGLE_AVATAR
        : null;

  const [selected, setSelected] = useState(currentSelection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelected(currentSelection);
      setError("");
    }

  }, [open, user?.avatar]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(selected);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update avatar"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="avatar-picker-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="avatar-picker-modal" role="dialog" aria-modal="true">
        <div className="avatar-picker-header">
          <span className="avatar-picker-title mono">Choose your avatar</span>
        </div>

        <div className="avatar-picker-body">
          {user?.googleAvatar && (
            <>
              <div className="avatar-picker-section-label">Google Avatar</div>
              <button
                type="button"
                className={`avatar-picker-google-row ${
                  selected === USE_GOOGLE_AVATAR ? "selected" : ""
                }`}
                onClick={() => setSelected(USE_GOOGLE_AVATAR)}
              >
                <img
                  src={user.googleAvatar}
                  alt="Google avatar"
                  className="avatar-image"
                  style={{ width: 40, height: 40 }}
                />
                <span>Use Google Avatar</span>
                {selected === USE_GOOGLE_AVATAR && (
                  <span className="avatar-picker-check">✓</span>
                )}
              </button>
            </>
          )}

          <div className="avatar-picker-section-label">
            PromptForge Avatars
          </div>

          <div className="avatar-picker-grid">
            {AVATAR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className="avatar-picker-tile"
                onClick={() => setSelected(preset.id)}
                aria-label={`Select ${preset.id}`}
              >
                <PresetAvatar
                  id={preset.id}
                  initials={initials}
                  size={56}
                  selected={selected === preset.id}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="avatar-picker-footer">
          {error && <span className="settings-form-error">{error}</span>}

          <div className="avatar-picker-actions">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="amber"
              onClick={handleSave}
              disabled={saving || !selected}
            >
              {saving ? "Saving…" : "Save Avatar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
