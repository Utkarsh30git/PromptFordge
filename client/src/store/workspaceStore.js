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

  // Version History panel (Workspace) — surfaces the SAME `versions`
  // array already loaded by selectPrompt/openPromptDirect. Opening it
  // is purely a UI toggle; it deliberately does NOT trigger a new
  // fetch, since the versions are already in state.
  versionHistoryOpen: false,
  restoringVersion: false,
  restoreError: null,

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

  // Quality Analysis (OpenAI prompt review — advisory, never touches
  // the editor/database). Tied to whichever version was analyzed, so
  // switching prompts/versions/collections clears it rather than
  // showing a stale score for different content.
  isAnalyzing: false,
  analysisError: null,
  qualityAnalysis: null, // { overallScore, scores, summary, suggestions, model }

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
      qualityAnalysis: null,
      analysisError: null,
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
      // A quality analysis is tied to the version it analyzed —
      // switching versions makes it stale/misleading, so clear it.
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
        // The newly saved version hasn't been analyzed under its own
        // versionId yet, even if its content happens to match what
        // was just analyzed — keep analysis strictly tied to a version.
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

  // ---------------- Version History (Workspace panel) ----------------

  openVersionHistory: () => set({ versionHistoryOpen: true, restoreError: null }),
  closeVersionHistory: () => set({ versionHistoryOpen: false }),

  // Restores an older version by writing its content through the
  // EXISTING save-version endpoint/flow — this is exactly what
  // clicking "Save Version" in the editor already does, just with
  // the restored content instead of whatever's currently typed. That
  // means restoring always creates a brand-new version (never
  // mutates or deletes anything), so history is never destroyed.
  restoreVersion: async (versionNumber) => {
    const { activePromptId, versions, restoringVersion } = get();
    if (!activePromptId || restoringVersion) return;

    const version = versions.find((v) => v.versionNumber === versionNumber);
    if (!version) return;

    set({ restoringVersion: true, restoreError: null });

    try {
      // Title is intentionally omitted — restoring content shouldn't
      // change the prompt's title.
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
        // A restored version hasn't been analyzed under its own
        // versionId yet — same rule saveVersion already follows.
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

  // ---------------- Quality Analysis (advisory, review-only) ----------------

  // Analyzes the PROMPT ITSELF — distinct from runPrompt (executes it)
  // and from Compare's judge (scores a response to a test input).
  // Never touches the editor, the database, or versions; only stages
  // a result for review. Respects whichever version is currently
  // being viewed by sending that version's id, mirroring how Compare
  // targets specific versions.
  // ---------------- Library integration ----------------

  // Opens a specific prompt directly (e.g. from the Prompt Library at
  // /prompts/:id, or any other deep link) without requiring its
  // collection to already be expanded in the sidebar first. Reuses
  // selectPrompt for all the actual loading, then syncs the sidebar's
  // active collection afterward so it doesn't reset the prompt state
  // selectPrompt just populated.
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
