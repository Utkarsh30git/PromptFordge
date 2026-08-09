export const COLLECTIONS = [
  "Frontend",
  "Backend",
  "Marketing",
  "Resume",
  "Interview",
  "Research",
];

export const INITIAL_VERSIONS = ["v1", "v2", "v3", "v4"];

export const DEFAULT_PROMPT = {
  title: "interview-question.prompt",
  content:
    "Write an interview question for a senior React developer...\n\nInclude one follow-up question about performance optimization.\n\nEnd with evaluation criteria.",
  model: "GPT-4.1",
  temperature: "0.7",
};
