export const extractJsonObject = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("AI response was empty");
  }

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response did not contain JSON");
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
};

export const asStringArray = (value, maxItems = 6) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(0, maxItems);
};

