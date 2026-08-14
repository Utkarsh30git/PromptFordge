import { create } from "zustand";
import * as collectionsApi from "../services/collectionsApi";
import * as promptsApi from "../services/promptsApi";
import { extractVariables, findMissingVariables } from "../utils/promptVariables";

const useWorkspaceStore = create((set, get) => ({

  collections: [],
  collectionsLoading: false,
  activeCollectionId: null,

  prompts: [],
  promptsLoading: false,
  activePromptId: null,
  activePrompt: null,
  promptLoading: false,

  versions: [],
  versionsLoading: false,
  viewingVersionNumber: null,

  editorTitle: "",
  editorContent: "",

  variables: [],
  variableValues: {},
  resolvedPrompt: null,
  missingVariables: [],

  versionHistoryOpen: false,
  restoringVersion: false,
  restoreError: null,

  saving: false,
  error: null,

  running: false,
  runError: null,
  response: null,
  runMeta: null,

  isOptimizing: false,
  optimizationError: null,
  optimizedPrompt: null,
  optimizationMetrics: null,
  optimizationModalOpen: false,

  isAnalyzing: false,
  analysisError: null,
  qualityAnalysis: null,

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
      qualityAnalysis: null,
      analysisError: null,
    });
    await get().fetchPrompts(collectionId);
  },

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

  deletePrompt: async (promptId) => {
    const { activePromptId } = get();
    set({ error: null });
    try {
      await promptsApi.deletePrompt(promptId);

      set((state) => ({
        prompts: state.prompts.filter((p) => p._id !== promptId),
      }));

      if (promptId === activePromptId) {
        set({
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
          qualityAnalysis: null,
          analysisError: null,
        });
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      set({ error: "Failed to delete prompt" });
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
      qualityAnalysis: null,
      analysisError: null,
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

      optimizedPrompt: null,
      optimizationMetrics: null,
      optimizationModalOpen: false,

      qualityAnalysis: null,
      analysisError: null,
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

        qualityAnalysis: null,
        analysisError: null,
      }));

      return version;
    } catch (error) {
      console.error("Failed to save version:", error);
      set({ saving: false, error: "Failed to save version" });
      throw error;
    }
  },

  openVersionHistory: () => set({ versionHistoryOpen: true, restoreError: null }),
  closeVersionHistory: () => set({ versionHistoryOpen: false }),

  restoreVersion: async (versionNumber) => {
    const { activePromptId, versions, restoringVersion } = get();
    if (!activePromptId || restoringVersion) return;

    const version = versions.find((v) => v.versionNumber === versionNumber);
    if (!version) return;

    set({ restoringVersion: true, restoreError: null });

    try {

      const { prompt, version: newVersion } = await promptsApi.savePromptVersion(
        activePromptId,
        { content: version.content }
      );

      const variables = extractVariables(newVersion.content);

      set((state) => ({
        activePrompt: prompt,
        versions: [...state.versions, newVersion],
        viewingVersionNumber: newVersion.versionNumber,
        editorContent: newVersion.content,
        editorTitle: prompt.title,
        variables,
        variableValues: {},
        missingVariables: variables,
        resolvedPrompt: null,
        restoringVersion: false,
        versionHistoryOpen: false,
        prompts: state.prompts.map((p) => (p._id === prompt._id ? prompt : p)),

        qualityAnalysis: null,
        analysisError: null,
      }));

      return newVersion;
    } catch (error) {
      console.error("Failed to restore version:", error);
      set({ restoringVersion: false, restoreError: "Unable to restore this version." });
      throw error;
    }
  },

  runPrompt: async ({ model = "gpt-4.1", temperature = 0.7 } = {}) => {
    const { activePromptId, running, editorContent, variableValues } = get();

    if (!activePromptId || running) return;

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

  cancelOptimize: () => {
    set({
      optimizationModalOpen: false,
      optimizedPrompt: null,
      optimizationMetrics: null,
    });
  },

  useOptimizedPrompt: () => {
    const { optimizedPrompt, variableValues } = get();
    if (optimizedPrompt === null) return;

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

  openPromptDirect: async (promptId) => {
    await get().selectPrompt(promptId);

    const prompt = get().activePrompt;
    if (!prompt) return;

    const collectionId = prompt.collectionId || null;
    if (collectionId !== get().activeCollectionId) {
      set({ activeCollectionId: collectionId });
      if (collectionId) {
        get().fetchPrompts(collectionId);
      }
    }
  },

  analyzePrompt: async () => {
    const { activePromptId, isAnalyzing, viewingVersionNumber, versions } = get();

    if (!activePromptId || isAnalyzing) return;

    const version = versions.find(
      (v) => v.versionNumber === viewingVersionNumber
    );

    set({ isAnalyzing: true, analysisError: null, error: null });

    try {
      const result = await promptsApi.analyzePrompt(activePromptId, {
        versionId: version?._id,
      });

      set({
        isAnalyzing: false,
        qualityAnalysis: {
          overallScore: result.overallScore,
          scores: result.scores,
          summary: result.summary,
          suggestions: result.suggestions,
          model: result.model,
        },
      });

      return result;
    } catch (error) {
      console.error("Failed to analyze prompt:", error);
      const message =
        error?.response?.data?.message || "Unable to analyze this prompt right now.";
      set({ isAnalyzing: false, analysisError: message });
      throw error;
    }
  },
}));

export default useWorkspaceStore;
