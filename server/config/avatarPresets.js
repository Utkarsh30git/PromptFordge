

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

export const isPresetAvatarId = (avatar) =>
  typeof avatar === "string" && avatar.startsWith("preset-");

export const USE_GOOGLE_AVATAR = "google";
