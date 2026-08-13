import { create } from "zustand";
import * as promptsApi from "../services/promptsApi";
import * as collectionsApi from "../services/collectionsApi";

// Dedicated store for the Prompt Library + Collections experience.
// Deliberately separate from workspaceStore: that store owns the
// single "currently open in the editor" prompt (content, variables,
// versions, run/optimize/analyze state); this store owns the
// browsable list (search/filter/sort/favorite/move) and never touches
// editor state. Keeping them apart avoids two sources of truth fighting
// over the same prompt while the user has it open in both places.
const usePromptLibraryStore = create((set, get) => ({
  prompts: [],
  promptsLoading: false,
  promptsError: null,

  collections: [],
  collectionsLoading: false,
  collectionsError: null,

  search: "",
  filter: "all", // all | favorites | recent
  sort: "newest", // newest | oldest | name_asc | name_desc
  activeCollectionId: null, // set when viewing a single collection

  // ---------------- Prompts ----------------

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

    // Optimistic update — the star should feel instant. If the
    // "Favorites" tab is active, an unfavorite should also drop the
    // card out of the current list rather than leaving a stale entry.
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
      // Roll back on failure and refetch to guarantee consistency.
      get().fetchPrompts();
    }
  },

  moveToCollection: async (promptId, collectionId) => {
    try {
      await promptsApi.updatePromptMeta(promptId, {
        collectionId: collectionId || "",
      });
      // Refetch — moving out of the currently-viewed collection means
      // the prompt should disappear from this list.
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

  // ---------------- Collections ----------------

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
