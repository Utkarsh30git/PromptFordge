// Canonical list of valid preset avatar identifiers. The backend
// only needs to know which ids are valid (to reject anything else);
// the actual visual design (gradient/colors) for each id lives on
// the frontend in src/constants/avatarPresets.js. Keep the id list
// here in sync with that file — the ids themselves are the only
// thing that has to match between the two.
export const AVATAR_PRESET_IDS = [
  "preset-01",
  "preset-02",
  "preset-03",
  "preset-04",
  "preset-05",
  "preset-06",
  "preset-07",
  "preset-08",
  "preset-09",
  "preset-10",
  "preset-11",
  "preset-12",
];

const AVATAR_PRESET_ID_SET = new Set(AVATAR_PRESET_IDS);

export const isValidAvatarPresetId = (id) => AVATAR_PRESET_ID_SET.has(id);

// Whether a stored `avatar` value is a PromptForge preset id, as
// opposed to a Google profile picture URL. Presets always use this
// reserved "preset-" namespace, so this check alone is enough to
// tell the two kinds of value apart wherever `avatar` is read.
export const isPresetAvatarId = (avatar) =>
  typeof avatar === "string" && avatar.startsWith("preset-");

// The single sentinel value the client sends to mean "switch back to
// my Google profile picture" (as opposed to a specific preset id).
export const USE_GOOGLE_AVATAR = "google";
