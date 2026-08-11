import api from "./api";

export const getAnalytics = async (range = "30d") => {
  const { data } = await api.get("/api/analytics", { params: { range } });
  return data;
};
