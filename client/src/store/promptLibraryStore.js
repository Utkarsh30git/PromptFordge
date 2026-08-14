import { create } from "zustand";
import * as promptsApi from "../services/promptsApi";
import * as collectionsApi from "../services/collectionsApi";

const usePromptLibraryStore = create((set, get) => ({
  prompts: [],
  promptsLoading: false,
  promptsError: null,

  collections: [],
  collectionsLoading: false,
  collectionsError: null,

  search: "",
  filter: "all",
  sort: "newest",
  activeCollectionId: null,

  fetchPrompts: async () => {
    const { search, filter, sort, activeCollectionId } = get();
    set({ promptsLoading: true, promptsError: null });
    try {
      const prompts = await promptsApi.listPrompts({
        search,
        filter,
        sort,
        collectionId: activeCollectionId || undefined,
      });
      set({ prompts, promptsLoading: false });
    } catch (error) {
      console.error("Failed to load prompts:", error);
      set({ promptsLoading: false, promptsError: "Unable to load prompts." });
    }
  },

  setSearch: (search) => {
    set({ search });
    get().fetchPrompts();
  },

  setFilter: (filter) => {
    set({ filter });
    get().fetchPrompts();
  },

  setSort: (sort) => {
    set({ sort });
    get().fetchPrompts();
  },

  toggleFavorite: async (promptId) => {
    const prompt = get().prompts.find((p) => p._id === promptId);
    if (!prompt) return;

    const nextValue = !prompt.isFavorite;

    set((state) => ({
      prompts:
        state.filter === "favorites" && !nextValue
          ? state.prompts.filter((p) => p._id !== promptId)
          : state.prompts.map((p) =>
              p._id === promptId ? { ...p, isFavorite: nextValue } : p
            ),
    }));

    try {
      await promptsApi.setPromptFavorite(promptId, nextValue);
    } catch (error) {
      console.error("Failed to update favorite:", error);

      get().fetchPrompts();
    }
  },

  moveToCollection: async (promptId, collectionId) => {
    try {
      await promptsApi.updatePromptMeta(promptId, {
        collectionId: collectionId || "",
      });

      get().fetchPrompts();
    } catch (error) {
      console.error("Failed to move prompt:", error);
      throw error;
    }
  },

  createPrompt: async (collectionId) => {
    try {
      const prompt = await promptsApi.createPrompt({
        title: "untitled.prompt",
        collectionId: collectionId || null,
      });
      return prompt;
    } catch (error) {
      console.error("Failed to create prompt:", error);
      throw error;
    }
  },

  deletePrompt: async (promptId) => {
    await promptsApi.deletePrompt(promptId);
    set((state) => ({
      prompts: state.prompts.filter((p) => p._id !== promptId),
    }));
  },

  fetchCollections: async () => {
    set({ collectionsLoading: true, collectionsError: null });
    try {
      const collections = await collectionsApi.listCollections();
      set({ collections, collectionsLoading: false });
    } catch (error) {
      console.error("Failed to load collections:", error);
      set({
        collectionsLoading: false,
        collectionsError: "Unable to load collections.",
      });
    }
  },

  createCollection: async (name) => {
    const collection = await collectionsApi.createCollection(name);
    set((state) => ({ collections: [...state.collections, collection] }));
    return collection;
  },

  renameCollection: async (id, name) => {
    const collection = await collectionsApi.renameCollection(id, name);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? collection : c)),
    }));
    return collection;
  },

  deleteCollection: async (id) => {
    await collectionsApi.deleteCollection(id);
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== id),
    }));
  },

  setActiveCollectionId: (collectionId) => {
    set({ activeCollectionId: collectionId });
    get().fetchPrompts();
  },
}));

export default usePromptLibraryStore;
