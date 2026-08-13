import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:8000";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => {
    set({
      user,
      loading: false,
    });
  },

  clearUser: () => {
    set({
      user: null,
      loading: false,
    });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/current-user`, {
        withCredentials: true,
      });

      set({
        user: response.data.user,
        loading: false,
      });
    } catch (error) {
      set({
        user: null,
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );
    } finally {
      set({
        user: null,
        loading: false,
      });
    }
  },

  // Updates the currently authenticated user's editable profile
  // fields (name only, today). Throws on failure so the caller
  // (Settings page) can show the backend's validation message —
  // unlike fetchCurrentUser/logout, which are fire-and-forget on
  // failure, a failed profile edit needs to surface to the user.
  updateProfile: async (name) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/auth/profile`,
        { name },
        { withCredentials: true },
      );

      set({ user: response.data.user });
      return response.data.user;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  },

  // Updates the user's avatar: either a PromptForge preset id
  // ("preset-07") or the "google" sentinel to switch back to their
  // Google profile picture. Same throw-on-failure shape as
  // updateProfile so the picker modal can show the backend's error.
  updateAvatar: async (avatar) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/auth/avatar`,
        { avatar },
        { withCredentials: true },
      );

      set({ user: response.data.user });
      return response.data.user;
    } catch (error) {
      console.error("Failed to update avatar:", error);
      throw error;
    }
  },
}));

export default useAuthStore;
