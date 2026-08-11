import api from "./api";

export const listCollections = async () => {
  const { data } = await api.get("/api/collections");
  return data.collections;
};

export const createCollection = async (name) => {
  const { data } = await api.post("/api/collections", { name });
  return data.collection;
};

export const renameCollection = async (id, name) => {
  const { data } = await api.put(`/api/collections/${id}`, { name });
  return data.collection;
};

export const deleteCollection = async (id) => {
  await api.delete(`/api/collections/${id}`);
};
