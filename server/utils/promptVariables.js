// Server-side mirror of src/utils/promptVariables.js. This copy is
// the AUTHORITATIVE one — the backend never trusts a resolved prompt
// sent by the frontend, so it re-detects and re-resolves variables
// itself from the saved template + the submitted values.

const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export const extractVariables = (template) => {
  if (!template) return [];

  const seen = new Set();
  const names = [];

  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
};

export const resolveVariables = (template, values = {}) => {
  if (!template) return template;

  return template.replace(VARIABLE_PATTERN, (fullMatch, name) => {
    const value = values[name];
    return value !== undefined && value !== null && value !== ""
      ? String(value)
      : fullMatch;
  });
};

export const findMissingVariables = (template, values = {}) => {
  return extractVariables(template).filter((name) => {
    const value = values[name];
    return value === undefined || value === null || value === "";
  });
};
