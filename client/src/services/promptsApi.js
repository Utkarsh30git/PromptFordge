import api from "./api";

export const listPrompts = async (params = {}) => {

  const query =
    typeof params === "string" || params === undefined
      ? params
        ? { collection: params }
        : {}
      : {
          ...(params.collectionId ? { collection: params.collectionId } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.filter && params.filter !== "all" ? { filter: params.filter } : {}),
          ...(params.sort ? { sort: params.sort } : {}),
        };

  const { data } = await api.get("/api/prompts", { params: query });
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

export const setPromptFavorite = async (id, isFavorite) => {
  const { data } = await api.put(`/api/prompts/${id}/favorite`, { isFavorite });
  return data.prompt;
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

export const analyzePrompt = async (id, { versionId } = {}) => {
  const { data } = await api.post(`/api/prompts/${id}/analyze`, {
    versionId,
  });
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
