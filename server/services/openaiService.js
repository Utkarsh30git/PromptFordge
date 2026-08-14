

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

const callChatCompletion = async ({
  messages,
  model,
  temperature,
  responseFormat,
}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured on the server");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      const error = new Error("OpenAI request timed out");
      error.code = "TIMEOUT";
      throw error;
    }

    const error = new Error("Failed to reach OpenAI");
    error.code = "NETWORK_ERROR";
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error("OpenAI returned an unreadable response");
    error.code = "OPENAI_ERROR";
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message || "OpenAI request failed");
    error.code = "OPENAI_ERROR";
    error.status = response.status;
    throw error;
  }

  const message = data.choices?.[0]?.message?.content ?? "";

  return {
    text: message,
    usage: data.usage || null,
    model: data.model || model,
  };
};

export const runPrompt = async ({ prompt, model, temperature }) => {
  const result = await callChatCompletion({
    messages: [{ role: "user", content: prompt }],
    model,
    temperature,
  });

  return {
    response: result.text,
    usage: result.usage,
    model: result.model,
  };
};

const OPTIMIZE_SYSTEM_INSTRUCTION = `You are an expert prompt engineer. You will be given a user's draft prompt for an AI system. Rewrite it into a clearer, more effective prompt.

Rules:
- Understand and preserve the user's original goal — never change the underlying task.
- Improve clarity and specificity; remove ambiguity.
- Add useful context, a clear role/persona, or constraints only when it genuinely helps — never invent facts, requirements, or details the user didn't imply.
- Improve the requested output format when useful (e.g. structure, lists, sections).
- Keep it concise — avoid unnecessary verbosity.
- The prompt may contain variable placeholders in the exact form {{variable_name}} (double curly braces, letters/numbers/underscores only). These are NOT text to rewrite or fill in — copy every {{variable_name}} placeholder into the output EXACTLY as written, character-for-character, in a position that still makes grammatical sense. Never guess or invent a value for a placeholder, never rename it, and never remove it.
- Return ONLY the rewritten prompt itself. Do not include any preamble like "Here is your optimized prompt:", do not add explanations, and do not wrap it in quotes or code fences.`;

const OPTIMIZE_TEMPERATURE = 0.3;

export const optimizePrompt = async ({ prompt, model }) => {
  const result = await callChatCompletion({
    messages: [
      { role: "system", content: OPTIMIZE_SYSTEM_INSTRUCTION },
      { role: "user", content: prompt },
    ],
    model,
    temperature: OPTIMIZE_TEMPERATURE,
  });

  return {
    optimizedPrompt: result.text.trim(),
    usage: result.usage,
    model: result.model,
  };
};

const JUDGE_SYSTEM_INSTRUCTION = `You are an expert AI response evaluator judging a head-to-head comparison between two prompts that were both run against the same test input.

Score Response A and Response B independently, each from 0 to 10, based on:
1. Relevance to the test input
2. Accuracy
3. Completeness
4. Clarity
5. How well it follows the instructions in its own prompt

Do NOT score based on response length, token count, or latency — judge only the usefulness and quality of the response itself.

Respond with ONLY a JSON object in exactly this shape, and nothing else:
{"scoreA": <number 0-10>, "scoreB": <number 0-10>, "winner": "A" | "B" | "tie", "reason": "<one or two sentence explanation>"}

"winner" must be "tie" only if the scores are equal or the difference is negligible (less than 0.5).`;

const JUDGE_TEMPERATURE = 0.2;

const isValidScore = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10;

export const judgeComparison = async ({
  input,
  promptA,
  responseA,
  promptB,
  responseB,
  model,
}) => {
  const userContent = `TEST INPUT:
${input}

--- PROMPT A ---
${promptA}

--- RESPONSE A ---
${responseA}

--- PROMPT B ---
${promptB}

--- RESPONSE B ---
${responseB}`;

  const result = await callChatCompletion({
    messages: [
      { role: "system", content: JUDGE_SYSTEM_INSTRUCTION },
      { role: "user", content: userContent },
    ],
    model,
    temperature: JUDGE_TEMPERATURE,
    responseFormat: { type: "json_object" },
  });

  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    const error = new Error("Judge returned an unparseable response");
    error.code = "JUDGE_INVALID_RESPONSE";
    throw error;
  }

  const { scoreA, scoreB, winner, reason } = parsed || {};

  const validWinner = winner === "A" || winner === "B" || winner === "tie";

  if (!isValidScore(scoreA) || !isValidScore(scoreB) || !validWinner) {
    const error = new Error("Judge returned an invalid score shape");
    error.code = "JUDGE_INVALID_RESPONSE";
    throw error;
  }

  return {
    scoreA,
    scoreB,
    winner,
    reason: typeof reason === "string" ? reason : "",
    usage: result.usage,
    model: result.model,
  };
};

const ANALYZE_SYSTEM_INSTRUCTION = `You are an expert prompt engineering reviewer. You will be given a user's draft prompt for an AI system. Analyze the prompt itself — you do not execute it and you do not rewrite it.

Score the prompt from 0 to 10 on each of these five dimensions:
- clarity: Does the prompt clearly communicate what the user wants? Look for an understandable objective, unambiguous wording, and clear instructions.
- specificity: Does the prompt provide enough concrete detail — requirements, constraints, measurable expectations?
- context: Does the prompt provide sufficient background — role, audience, domain, relevant situation?
- structure: Is the prompt organized logically — sections, ordered instructions, separation between context and task?
- outputDefinition: Does the prompt clearly specify what should be returned — format, length, style, required sections?

Rules:
- Evaluate objectively and preserve the user's intent — do not judge whether the underlying task itself is a good idea.
- The prompt may contain variable placeholders in the exact form {{variable_name}} (double curly braces, letters/numbers/underscores only). These are intentional, reusable template slots — never penalize the prompt for using them, and never require a concrete value in place of one.
- Do not invent or assume missing context that isn't actually in the prompt.
- Write a concise 1-2 sentence summary of the prompt's overall strengths and weaknesses.
- Provide 2 to 5 actionable suggestions. Each suggestion must be specific to what THIS prompt is actually missing or could improve — never generic advice like "improve the prompt" or "add more detail". Each suggestion's "category" must be exactly one of: clarity, specificity, context, structure, outputDefinition.
- Respond with ONLY a JSON object in exactly this shape, and nothing else:
{"scores": {"clarity": <0-10>, "specificity": <0-10>, "context": <0-10>, "structure": <0-10>, "outputDefinition": <0-10>}, "summary": "<1-2 sentences>", "suggestions": [{"category": "<dimension name>", "message": "<specific, actionable suggestion>"}]}`;

const ANALYZE_TEMPERATURE = 0.2;

const ANALYZE_DIMENSIONS = ["clarity", "specificity", "context", "structure", "outputDefinition"];
const ANALYZE_CATEGORIES = new Set(ANALYZE_DIMENSIONS);

const isValidAnalyzeScore = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10;

export const analyzePromptQuality = async ({ prompt, model }) => {
  const result = await callChatCompletion({
    messages: [
      { role: "system", content: ANALYZE_SYSTEM_INSTRUCTION },
      { role: "user", content: prompt },
    ],
    model,
    temperature: ANALYZE_TEMPERATURE,
    responseFormat: { type: "json_object" },
  });

  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    const error = new Error("Analyzer returned an unparseable response");
    error.code = "ANALYSIS_INVALID_RESPONSE";
    throw error;
  }

  const { scores, summary, suggestions } = parsed || {};

  const validScores =
    scores &&
    typeof scores === "object" &&
    ANALYZE_DIMENSIONS.every((dim) => isValidAnalyzeScore(scores[dim]));

  const validSuggestions =
    Array.isArray(suggestions) &&
    suggestions.every(
      (s) =>
        s &&
        typeof s.message === "string" &&
        s.message.trim().length > 0 &&
        ANALYZE_CATEGORIES.has(s.category)
    );

  if (!validScores || typeof summary !== "string" || !validSuggestions) {
    const error = new Error("Analyzer returned an invalid response shape");
    error.code = "ANALYSIS_INVALID_RESPONSE";
    throw error;
  }

  const cleanScores = {};
  ANALYZE_DIMENSIONS.forEach((dim) => {
    cleanScores[dim] = scores[dim];
  });

  return {
    scores: cleanScores,
    summary: summary.trim(),

    suggestions: suggestions.slice(0, 5).map((s) => ({
      category: s.category,
      message: s.message.trim(),
    })),
    usage: result.usage,
    model: result.model,
  };
};
