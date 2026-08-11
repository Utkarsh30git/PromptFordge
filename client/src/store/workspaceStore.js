import { create } from "zustand";
import * as collectionsApi from "../services/collectionsApi";
import * as promptsApi from "../services/promptsApi";
import { extractVariables, findMissingVariables } from "../utils/promptVariables";

const useWorkspaceStore = create((set, get) => ({
  // Collections
  collections: [],
  collectionsLoading: false,
  activeCollectionId: null,

  // Prompts (for the active collection)
  prompts: [],
  promptsLoading: false,
  activePromptId: null,
  activePrompt: null,
  promptLoading: false,

  // Versions (for the active prompt)
  versions: [],
  versionsLoading: false,
  viewingVersionNumber: null, // null = nothing loaded yet / no versions

  // Editor (local, unsaved-until-"Save Version") state
  editorTitle: "",
  editorContent: "",

  // Variables ({{name}} placeholders detected in editorContent).
  // variableValues is keyed by variable name and persists across
  // detection updates (so retyping a template doesn't wipe values
  // for variables that are still present).
  variables: [], // string[] — detected, in template order, no dupes
  variableValues: {}, // { [name]: string }
  resolvedPrompt: null, // last-resolved preview, shown post-run
  missingVariables: [], // names still unset — blocks Run when non-empty

  saving: false,
  error: null,

  // Run (OpenAI execution)
  running: false,
  runError: null,
  response: null,
  runMeta: null, // { model, temperature, latency, tokens, cost, ... }

  // Optimize (OpenAI prompt rewrite — reviewed before it touches the editor)
  isOptimizing: false,
  optimizationError: null,
  optimizedPrompt: null,
  optimizationMetrics: null, // { model, latency, tokens, cost }
  optimizationModalOpen: false,

  // ---------------- Collections ----------------

  fetchCollections: async () => {
    set({ collectionsLoading: true, error: null });
    try {
      const collections = await collectionsApi.listCollections();
      set({ collections, collectionsLoading: false });
    } catch (error) {
      console.error("Failed to load collections:", error);
      set({ collectionsLoading: false, error: "Failed to load collections" });
    }
  },

  createCollection: async (name) => {
    set({ error: null });
    try {
      const collection = await collectionsApi.createCollection(name);
      set((state) => ({ collections: [...state.collections, collection] }));
      await get().selectCollection(collection._id);
      return collection;
    } catch (error) {
      console.error("Failed to create collection:", error);
      const message =
        error?.response?.data?.message || "Failed to create collection";
      set({ error: message });
      throw error;
    }
  },

  selectCollection: async (collectionId) => {
    set({
      activeCollectionId: collectionId,
      activePromptId: null,
      activePrompt: null,
      versions: [],
      viewingVersionNumber: null,
      editorTitle: "",
      editorContent: "",
      variables: [],
      variableValues: {},
      resolvedPrompt: null,
      missingVariables: [],
      response: null,
      runMeta: null,
      runError: null,
      optimizedPrompt: null,
      optimizationMetrics: null,
      optimizationError: null,
      optimizationModalOpen: false,
    });
    await get().fetchPrompts(collectionId);
  },

  // ---------------- Prompts ----------------

  fetchPrompts: async (collectionId) => {
    set({ promptsLoading: true, error: null });
    try {
      const prompts = await promptsApi.listPrompts(collectionId);
      set({ prompts, promptsLoading: false });
    } catch (error) {
      console.error("Failed to load prompts:", error);
      set({ promptsLoading: false, error: "Failed to load prompts" });
    }
  },

  createPrompt: async () => {
    const { activeCollectionId } = get();
    set({ error: null });
    try {
      const prompt = await promptsApi.createPrompt({
        title: "untitled.prompt",
        collectionId: activeCollectionId,
      });
      set((state) => ({ prompts: [prompt, ...state.prompts] }));
      await get().selectPrompt(prompt._id);
      return prompt;
    } catch (error) {
      console.error("Failed to create prompt:", error);
      set({ error: "Failed to create prompt" });
      throw error;
    }
  },

  selectPrompt: async (promptId) => {
    set({
      activePromptId: promptId,
      promptLoading: true,
      versionsLoading: true,
      error: null,
      response: null,
      runMeta: null,
      runError: null,
      resolvedPrompt: null,
      optimizedPrompt: null,
      optimizationMetrics: null,
      optimizationError: null,
      optimizationModalOpen: false,
    });

    try {
      const [prompt, versions] = await Promise.all([
        promptsApi.getPrompt(promptId),
        promptsApi.listPromptVersions(promptId),
      ]);

      const latest = versions[versions.length - 1];
      const variables = extractVariables(prompt.content);

      set({
        activePrompt: prompt,
        promptLoading: false,
        versions,
        versionsLoading: false,
        viewingVersionNumber: latest ? latest.versionNumber : null,
        editorTitle: prompt.title,
        editorContent: prompt.content,
        variables,
        variableValues: {},
        missingVariables: variables,
      });
    } catch (error) {
      console.error("Failed to load prompt:", error);
      set({
        promptLoading: false,
        versionsLoading: false,
        error: "Failed to load prompt",
      });
    }
  },

  setEditorTitle: (title) => set({ editorTitle: title }),

  // Re-detects {{variables}} from fresh content, keeping any existing
  // values for variables that are still present (so retyping/adding
  // text doesn't wipe out what the user already filled in) and
  // dropping values for variables that disappeared.
  setEditorContent: (content) => {
    const variables = extractVariables(content);
    const { variableValues } = get();
    const nextValues = {};
    variables.forEach((name) => {
      if (variableValues[name] !== undefined) {
        nextValues[name] = variableValues[name];
      }
    });

    set({
      editorContent: content,
      variables,
      variableValues: nextValues,
      missingVariables: findMissingVariables(content, nextValues),
      resolvedPrompt: null,
    });
  },

  setVariableValue: (name, value) => {
    set((state) => {
      const variableValues = { ...state.variableValues, [name]: value };
      return {
        variableValues,
        missingVariables: findMissingVariables(state.editorContent, variableValues),
      };
    });
  },

  // Switch which version's content is shown in the editor, without
  // touching anything on the server — old versions stay untouched
  // until the user explicitly saves again.
  selectVersion: (versionNumber) => {
    const version = get().versions.find(
      (v) => v.versionNumber === versionNumber
    );
    if (!version) return;

    const variables = extractVariables(version.content);

    set({
      viewingVersionNumber: versionNumber,
      editorContent: version.content,
      variables,
      variableValues: {},
      missingVariables: variables,
      resolvedPrompt: null,
      // Switching versions makes any pending optimize review stale —
      // it was generated from different base content.
      optimizedPrompt: null,
      optimizationMetrics: null,
      optimizationModalOpen: false,
    });
  },

  saveVersion: async () => {
    const { activePromptId, editorTitle, editorContent } = get();
    if (!activePromptId) return;

    set({ saving: true, error: null });

    try {
      const { prompt, version } = await promptsApi.savePromptVersion(
        activePromptId,
        { title: editorTitle, content: editorContent }
      );

      set((state) => ({
        activePrompt: prompt,
        versions: [...state.versions, version],
        viewingVersionNumber: version.versionNumber,
        editorTitle: prompt.title,
        saving: false,
        prompts: state.prompts.map((p) =>
          p._id === prompt._id ? prompt : p
        ),
      }));

      return version;
    } catch (error) {
      console.error("Failed to save version:", error);
      set({ saving: false, error: "Failed to save version" });
      throw error;
    }
  },

  // ---------------- Run (OpenAI execution) ----------------

  runPrompt: async ({ model = "gpt-4.1", temperature = 0.7 } = {}) => {
    const { activePromptId, running, editorContent, variableValues } = get();

    // Guard against duplicate/overlapping requests — the button is
    // also disabled while running, but this makes the store itself
    // safe against any caller firing run() twice in a row.
    if (!activePromptId || running) return;

    // Client-side check purely for a fast, friendly message — the
    // backend re-validates against the SAVED template regardless.
    const missing = findMissingVariables(editorContent, variableValues);
    if (missing.length > 0) {
      const message =
        missing.length === 1
          ? `Please provide a value for ${missing[0]}.`
          : `Missing values for: ${missing.join(", ")}`;
      set({ runError: message, missingVariables: missing });
      return;
    }

    set({ running: true, runError: null, error: null });

    try {
      const result = await promptsApi.runPrompt(activePromptId, {
        model,
        temperature,
        variables: variableValues,
      });

      set({
        running: false,
        response: result.response,
        resolvedPrompt: result.resolvedPrompt ?? null,
        runMeta: {
          model: result.model,
          temperature: result.temperature,
          latency: result.latency,
          tokens: result.tokens,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          cost: result.cost,
          creditsRemaining: result.creditsRemaining,
        },
      });

      return result;
    } catch (error) {
      console.error("Failed to run prompt:", error);
      const message =
        error?.response?.data?.message || "Failed to run prompt";
      set({ running: false, runError: message });
      throw error;
    }
  },

  // ---------------- Optimize (prompt rewrite, review-before-apply) ----------------

  // Analyzes/rewrites the prompt itself — completely separate from
  // runPrompt (which executes it). Nothing here touches the editor,
  // the database, or versions: it only stages a result for review.
  optimizePrompt: async () => {
    const { activePromptId, isOptimizing } = get();

    if (!activePromptId || isOptimizing) return;

    set({ isOptimizing: true, optimizationError: null, error: null });

    try {
      const result = await promptsApi.optimizePrompt(activePromptId);

      set({
        isOptimizing: false,
        optimizedPrompt: result.optimizedPrompt,
        optimizationMetrics: {
          model: result.model,
          latency: result.latency,
          tokens: result.tokens,
          cost: result.cost,
        },
        optimizationModalOpen: true,
      });

      return result;
    } catch (error) {
      console.error("Failed to optimize prompt:", error);
      const message =
        error?.response?.data?.message || "Failed to optimize prompt";
      set({ isOptimizing: false, optimizationError: message });
      throw error;
    }
  },

  // "Cancel" — close the review UI, keep the editor exactly as it was.
  cancelOptimize: () => {
    set({
      optimizationModalOpen: false,
      optimizedPrompt: null,
      optimizationMetrics: null,
    });
  },

  // "Use Optimized Prompt" — replaces the EDITOR content only. Does
  // NOT save a version and does NOT touch the database; the user
  // still has to click Save Version to persist it (matching the
  // exact same rule Run already follows).
  useOptimizedPrompt: () => {
    const { optimizedPrompt, variableValues } = get();
    if (optimizedPrompt === null) return;

    // Preserve values for variables the optimized prompt kept.
    const variables = extractVariables(optimizedPrompt);
    const nextValues = {};
    variables.forEach((name) => {
      if (variableValues[name] !== undefined) {
        nextValues[name] = variableValues[name];
      }
    });

    set({
      editorContent: optimizedPrompt,
      variables,
      variableValues: nextValues,
      missingVariables: findMissingVariables(optimizedPrompt, nextValues),
      resolvedPrompt: null,
      optimizationModalOpen: false,
      optimizedPrompt: null,
      optimizationMetrics: null,
    });
  },
}));

export default useWorkspaceStore;
