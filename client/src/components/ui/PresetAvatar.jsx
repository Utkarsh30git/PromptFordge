import { getAvatarPreset } from "../../constants/avatarPresets";

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
