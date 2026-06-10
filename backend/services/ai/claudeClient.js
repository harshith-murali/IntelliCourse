import { extractJsonObject } from "./jsonParser.js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const getClaudeApiKey = () =>
  (process.env.CLAUDE_API_KEY || process.env.claude_api_key || process.env.ANTHROPIC_API_KEY || "").trim();

export const isClaudeConfigured = () => Boolean(getClaudeApiKey());

export const callClaudeJson = async ({ system, user, maxTokens = 700, temperature = 0.2 }) => {
  const apiKey = getClaudeApiKey();
  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.CLAUDE_TIMEOUT_MS || 20000));

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-4-5",
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const message = response.status === 401 ? "Claude authentication failed" : "Claude request failed";
      const detail = await response.text().catch(() => "");
      throw new Error(`${message} (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
    }

    const payload = await response.json();
    const text = payload.content?.map((part) => part.text || "").join("\n").trim();
    return extractJsonObject(text);
  } finally {
    clearTimeout(timeout);
  }
};
