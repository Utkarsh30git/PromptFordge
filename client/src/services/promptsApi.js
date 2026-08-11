import api from "./api";

export const listPrompts = async (collectionId) => {
  const { data } = await api.get("/api/prompts", {
    params: collectionId ? { collection: collectionId } : {},
  });
  return data.prompts;
};

export const getPrompt = async (id) => {
  const { data } = await api.get(`/api/prompts/${id}`);
  return data.prompt;
};

export const createPrompt = async ({ title, collectionId }) => {
  const { data } = await api.post("/api/prompts", {
    title,
    collection: collectionId,
  });
  return data.prompt;
};

export const updatePromptMeta = async (id, { title, collectionId }) => {
  const body = {};
  if (title !== undefined) body.title = title;
  if (collectionId !== undefined) body.collection = collectionId;

  const { data } = await api.put(`/api/prompts/${id}`, body);
  return data.prompt;
};

export const deletePrompt = async (id) => {
  await api.delete(`/api/prompts/${id}`);
};

export const savePromptVersion = async (id, { title, content }) => {
  const { data } = await api.post(`/api/prompts/${id}/save`, {
    title,
    content,
  });
  return { prompt: data.prompt, version: data.version };
};

export const listPromptVersions = async (id) => {
  const { data } = await api.get(`/api/prompts/${id}/versions`);
  return data.versions;
};

export const runPrompt = async (id, { model, temperature, variables } = {}) => {
  const { data } = await api.post(`/api/prompts/${id}/run`, {
    model,
    temperature,
    variables,
  });
  return data;
};

export const optimizePrompt = async (id) => {
  const { data } = await api.post(`/api/prompts/${id}/optimize`);
  return data;
};

export const compareVersions = async ({
  promptId,
  versionAId,
  versionBId,
  input,
  model,
  temperature,
  variables,
}) => {
  const { data } = await api.post("/api/prompts/compare", {
    promptId,
    versionAId,
    versionBId,
    input,
    model,
    temperature,
    variables,
  });
  return data;
};
