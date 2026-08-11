import { create } from "zustand";
import * as analyticsApi from "../services/analyticsApi";

// Single source of truth for real analytics data — used by both the
// Analytics page and the Dashboard's overview cards/recent activity,
// so the aggregation logic and the numbers shown are never computed
// twice in two different places.
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
