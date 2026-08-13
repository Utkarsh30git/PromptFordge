import { getAvatarPreset } from "../../constants/avatarPresets";

// Renders one PromptForge preset avatar: a gradient circle with the
// user's initials on top (GitHub/Slack-style colored-initial
// avatars) — no image files, nothing to upload or host, and nothing
// that could ever be a copyrighted photo or character.
//
// Used both for the "live" avatar (navbar, Settings header, via
// UserAvatar) and inside the picker grid, where `selected` adds the
// amber selection ring.
const PresetAvatar = ({
  id,
  initials = "?",
  size = 28,
  selected = false,
  className = "",
}) => {
  const preset = getAvatarPreset(id);
  const background = preset
    ? preset.gradient
    : "linear-gradient(135deg, #3f3f46, #27272a)";

  return (
    <span
      className={`preset-avatar ${selected ? "preset-avatar-selected" : ""} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.4)),
        background,
      }}
    >
      {initials}
    </span>
  );
};

export default PresetAvatar;
