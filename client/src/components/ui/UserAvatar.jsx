import { useState } from "react";
import PresetAvatar from "./PresetAvatar";
import { isPresetAvatarId } from "../../constants/avatarPresets";

const UserAvatar = ({ user, size = 28, className = "" }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = user?.name?.charAt(0).toUpperCase() || "?";

  if (user?.avatar && isPresetAvatarId(user.avatar)) {
    return (
      <PresetAvatar
        id={user.avatar}
        initials={initials}
        size={size}
        className={className}
      />
    );
  }

  if (user?.avatar && !imgFailed) {
    return (
      <img
        src={user.avatar}
        alt={user.name || "Account"}
        className={`avatar-image ${className}`.trim()}
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`avatar-fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.42)) }}
    >
      {initials}
    </span>
  );
};

export default UserAvatar;
