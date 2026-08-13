import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      // Holds either the Google profile picture URL (default, from
      // first login) or a PromptForge preset avatar identifier
      // (e.g. "preset-07") once the user picks one in Settings.
      // Which kind it is can always be told apart by prefix — see
      // isPresetAvatarId() in config/avatarPresets.js.
    },

    // The user's ORIGINAL Google avatar URL, captured once at first
    // login and never overwritten afterward — kept separately from
    // `avatar` so switching to a preset never loses the ability to
    // switch back via "Use Google Avatar".
    googleAvatar: {
      type: String,
      default: "",
    },

    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    credits: {
      type: Number,
      default: 100,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;