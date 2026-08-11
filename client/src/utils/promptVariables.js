// Pure helpers for the Prompt Variables feature.
//
// A prompt TEMPLATE (what's saved to Mongo) can contain placeholders
// like {{role}} or {{ technology }}. These utilities detect those
// placeholders and — only at Run/Optimize-preview/Compare time —
// resolve them into a final string. The template itself is never
// mutated by any of this.

// Letters, numbers, underscores only; surrounding whitespace inside
// the braces is allowed and normalized away, e.g. "{{ role }}" -> "role".
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

/**
 * Returns the list of unique variable names found in a template, in
 * first-appearance order. Duplicate occurrences of the same name
 * collapse to a single entry.
 *
 * extractVariables("Use {{tech}}. Explain {{tech}}.") -> ["tech"]
 */
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

/**
 * Given a template and a { name: value } map, returns the resolved
 * string with every {{name}} occurrence replaced by its value.
 * Variables with no entry in `values` (or an empty value) are left
 * as-is — callers should validate with findMissingVariables first if
 * that's not acceptable.
 */
export const resolveVariables = (template, values = {}) => {
  if (!template) return template;

  return template.replace(VARIABLE_PATTERN, (fullMatch, name) => {
    const value = values[name];
    return value !== undefined && value !== null && value !== ""
      ? String(value)
      : fullMatch;
  });
};

/**
 * Returns the subset of a template's variable names that don't have
 * a non-empty value in `values`, in template order.
 */
export const findMissingVariables = (template, values = {}) => {
  return extractVariables(template).filter((name) => {
    const value = values[name];
    return value === undefined || value === null || value === "";
  });
};
