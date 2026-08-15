import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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
