import { create } from "zustand";
import * as promptsApi from "../services/promptsApi";
import { extractVariables, findMissingVariables } from "../utils/promptVariables";

const useCompareStore = create((set, get) => ({
  prompts: [],
  promptsLoading: false,

  selectedPromptId: null,
  versions: [],
  versionsLoading: false,

  versionAId: null,
  versionBId: null,

  variables: [],
  variableValues: {},
  missingVariables: [],

  testInput: "",

  comparing: false,
  compareError: null,
  result: null,

  fetchPrompts: async () => {
    set({ promptsLoading: true, compareError: null });
    try {
      const prompts = await promptsApi.listPrompts();
      set({ prompts, promptsLoading: false });
    } catch (error) {
      console.error("Failed to load prompts:", error);
      set({ promptsLoading: false, compareError: "Failed to load prompts" });
    }
  },

  selectPrompt: async (promptId) => {
    set({
      selectedPromptId: promptId,
      versions: [],
      versionAId: null,
      versionBId: null,
      variables: [],
      variableValues: {},
      missingVariables: [],
      result: null,
      compareError: null,
      versionsLoading: true,
    });

    if (!promptId) {
      set({ versionsLoading: false });
      return;
    }

    try {
      const versions = await promptsApi.listPromptVersions(promptId);
      set({ versions, versionsLoading: false });
    } catch (error) {
      console.error("Failed to load versions:", error);
      set({ versionsLoading: false, compareError: "Failed to load versions" });
    }
  },

  _recomputeVariables: () => {
    const { versions, versionAId, versionBId, variableValues } = get();
    const versionA = versions.find((v) => v._id === versionAId);
    const versionB = versions.find((v) => v._id === versionBId);

    const seen = new Set();
    const variables = [];
    [versionA, versionB].forEach((v) => {
      if (!v) return;
      extractVariables(v.content).forEach((name) => {
        if (!seen.has(name)) {
          seen.add(name);
          variables.push(name);
        }
      });
    });

    const nextValues = {};
    variables.forEach((name) => {
      if (variableValues[name] !== undefined) nextValues[name] = variableValues[name];
    });

    const templateUnion = [versionA?.content, versionB?.content]
      .filter(Boolean)
      .join(" ");

    set({
      variables,
      variableValues: nextValues,
      missingVariables: findMissingVariables(templateUnion, nextValues),
    });
  },

  setVersionA: (versionId) => {
    set({ versionAId: versionId, result: null });
    get()._recomputeVariables();
  },
  setVersionB: (versionId) => {
    set({ versionBId: versionId, result: null });
    get()._recomputeVariables();
  },
  setVariableValue: (name, value) => {
    set((state) => {
      const variableValues = { ...state.variableValues, [name]: value };
      const { versions, versionAId, versionBId } = state;
      const versionA = versions.find((v) => v._id === versionAId);
      const versionB = versions.find((v) => v._id === versionBId);
      const templateUnion = [versionA?.content, versionB?.content]
        .filter(Boolean)
        .join(" ");
      return {
        variableValues,
        missingVariables: findMissingVariables(templateUnion, variableValues),
      };
    });
  },
  setTestInput: (value) => set({ testInput: value }),

  startComparison: async ({ promptId, versionAId, versionBId }) => {
    await get().selectPrompt(promptId);
    set({ versionAId, versionBId, result: null, compareError: null });
    get()._recomputeVariables();
  },

  runCompare: async () => {
    const {
      selectedPromptId,
      versionAId,
      versionBId,
      testInput,
      comparing,
      variableValues,
      missingVariables,
    } = get();

    if (comparing) return;

    if (!selectedPromptId || !versionAId || !versionBId) {
      set({ compareError: "Select a prompt and two versions to compare" });
      return;
    }

    if (versionAId === versionBId) {
      set({ compareError: "Choose two different versions to compare" });
      return;
    }

    if (!testInput.trim()) {
      set({ compareError: "Enter a test input to run both prompts against" });
      return;
    }

    if (missingVariables.length > 0) {
      set({
        compareError:
          missingVariables.length === 1
            ? `Missing value for: ${missingVariables[0]}`
            : `Missing values for: ${missingVariables.join(", ")}`,
      });
      return;
    }

    set({ comparing: true, compareError: null, result: null });

    try {
      const result = await promptsApi.compareVersions({
        promptId: selectedPromptId,
        versionAId,
        versionBId,
        input: testInput.trim(),
        variables: variableValues,
      });

      set({ comparing: false, result });
      return result;
    } catch (error) {
      console.error("Failed to compare prompts:", error);
      const message =
        error?.response?.data?.message || "Failed to compare prompts";
      set({ comparing: false, compareError: message });
      throw error;
    }
  },
}));

export default useCompareStore;
