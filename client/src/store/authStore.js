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
}));

export default useAuthStore;
