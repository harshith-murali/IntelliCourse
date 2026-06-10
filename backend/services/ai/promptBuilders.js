const lessonBlock = (context) => `
Course title: ${context.courseTitle}
Course subtitle: ${context.courseSubtitle || "Not provided"}
Course category: ${context.courseCategory || "Not provided"}
Course level: ${context.courseLevel || "Not provided"}
Course description: ${context.courseDescription || "Not provided"}
Lesson title: ${context.lessonTitle}
Lesson description: ${context.lessonDescription || "Not provided"}
Lesson order: ${context.lessonOrder || "Not provided"}
Nearby lessons: ${context.nearbyLessons?.length ? context.nearbyLessons.join(", ") : "Not provided"}
Best available lesson content source: ${context.primarySource}
Lesson transcript: ${context.transcript || "Not provided"}
Lesson notes: ${context.notes || "Not provided"}
Metadata fallback: ${context.metadataFallback || "Not provided"}
Context quality: ${context.contextQuality}
`;

export const buildSummaryPrompt = (context) => ({
  system:
    "You are a concise LMS study assistant. Return JSON only. Use transcript first, then notes, then description, then metadata. Do not invent facts outside the provided context. If context is metadata-only, make a lighter overview and clearly avoid pretending details were taught.",
  user: `
Summarize this lesson for a student.

${lessonBlock(context)}

Return exactly this JSON shape:
{
  "summary": "short paragraph",
  "keyPoints": ["3 to 6 concise bullet points"],
  "estimatedReadTime": "for example: 2 min"
}
`,
});

export const buildAskPrompt = (context, question) => ({
  system:
    "You are a grounded lesson Q&A assistant. Return JSON only. Use transcript first, then notes, then description, then metadata. If the answer is not present in the provided context, say the lesson content does not provide enough information and offer what can be inferred from course/lesson metadata.",
  user: `
Lesson context:
${lessonBlock(context)}

Student question: ${question}

Return exactly this JSON shape:
{
  "answer": "student-friendly answer grounded in the lesson",
  "followUpQuestions": ["2 to 4 useful follow-up questions"]
}
`,
});

export const buildQuizPrompt = (context, count) => ({
  system:
    "You generate simple multiple-choice quizzes from lesson content. Return JSON only. Use transcript first, then notes, then description, then metadata. If context is metadata-only, create broad orientation questions about the course/lesson topic, not detailed factual claims.",
  user: `
Create ${count} multiple-choice questions from this lesson.

${lessonBlock(context)}

Rules:
- Each question must have exactly 4 options.
- correctAnswer must exactly match one option.
- Keep explanations short.

Return exactly this JSON shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
`,
});

export const buildRecommendationReasonsPrompt = ({ profile, courses }) => ({
  system:
    "You write short recommendation reasons for an LMS. Do not change course ids. Return JSON only.",
  user: `
Learner profile:
${JSON.stringify(profile, null, 2)}

Candidate courses:
${JSON.stringify(courses, null, 2)}

Write one concise reason per course based only on the learner profile and deterministic signals. Do not invent learner activity not in the profile.

Return exactly this JSON shape:
{
  "reasons": [
    { "courseId": "string", "reason": "short reason" }
  ]
}
`,
});
