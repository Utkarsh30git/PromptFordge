import { create } from "zustand";
import * as analyticsApi from "../services/analyticsApi";

const useAnalyticsStore = create((set, get) => ({
  range: "30d",
  data: null,
  loading: false,
  error: null,

  setRange: (range) => {
    if (range === get().range) return;
    set({ range });
    get().fetchAnalytics(range);
  },

  fetchAnalytics: async (range) => {
    const targetRange = range || get().range;
    set({ loading: true, error: null });

    try {
      const data = await analyticsApi.getAnalytics(targetRange);
      set({ data, loading: false });
      return data;
    } catch (error) {
      console.error("Failed to load analytics:", error);
      set({ loading: false, error: "Failed to load analytics" });
      throw error;
    }
  },
}));

export default useAnalyticsStore;
