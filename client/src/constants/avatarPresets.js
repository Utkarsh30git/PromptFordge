// Visual design for each preset avatar id. Original, abstract
// gradient swatches only — no photos, no characters, nothing
// copyrighted. Keep the id list in sync with the backend's
// server/config/avatarPresets.js (the backend only validates ids;
// this file is the only place that decides what each one looks like).
//
// Each preset renders as a gradient circle with the user's initials
// on top (like GitHub/Slack's colored-initial avatars) — no image
// assets required, so there's nothing to upload or host.
export const AVATAR_PRESETS = [
  { id: "preset-01", gradient: "linear-gradient(135deg, #FFB100, #FF7A1A)" },
  { id: "preset-02", gradient: "linear-gradient(135deg, #2DD4BF, #0EA5A0)" },
  { id: "preset-03", gradient: "linear-gradient(135deg, #818CF8, #4F46E5)" },
  { id: "preset-04", gradient: "linear-gradient(135deg, #F472B6, #DB2777)" },
  { id: "preset-05", gradient: "linear-gradient(135deg, #4ADE80, #16A34A)" },
  { id: "preset-06", gradient: "linear-gradient(135deg, #60A5FA, #2563EB)" },
  { id: "preset-07", gradient: "linear-gradient(135deg, #FB923C, #C2410C)" },
  { id: "preset-08", gradient: "linear-gradient(135deg, #A78BFA, #7C3AED)" },
  { id: "preset-09", gradient: "linear-gradient(135deg, #F87171, #B91C1C)" },
  { id: "preset-10", gradient: "linear-gradient(135deg, #34D399, #0D9488)" },
  { id: "preset-11", gradient: "linear-gradient(135deg, #FCD34D, #D97706)" },
  { id: "preset-12", gradient: "linear-gradient(135deg, #38BDF8, #0369A1)" },
];

const PRESET_BY_ID = new Map(AVATAR_PRESETS.map((p) => [p.id, p]));

export const getAvatarPreset = (id) => PRESET_BY_ID.get(id) || null;

export const isPresetAvatarId = (avatar) =>
  typeof avatar === "string" && avatar.startsWith("preset-");

// Mirrors the backend's config/avatarPresets.js sentinel — the value
// sent to PATCH /api/auth/avatar to mean "switch back to my Google
// profile picture" rather than a specific preset id.
export const USE_GOOGLE_AVATAR = "google";
