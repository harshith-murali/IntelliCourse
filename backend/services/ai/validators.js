import { asStringArray } from "./jsonParser.js";

export const validateSummaryResponse = (data) => ({
  summary: typeof data.summary === "string" ? data.summary.trim() : "",
  keyPoints: asStringArray(data.keyPoints, 6),
  estimatedReadTime: typeof data.estimatedReadTime === "string" ? data.estimatedReadTime.trim() : "1 min",
});

export const validateAskResponse = (data) => ({
  answer: typeof data.answer === "string" ? data.answer.trim() : "",
  followUpQuestions: asStringArray(data.followUpQuestions, 4),
});

export const validateQuizResponse = (data, count) => {
  const questions = Array.isArray(data.questions) ? data.questions : [];
  return {
    questions: questions
      .map((item) => {
        const options = asStringArray(item.options, 4);
        return {
          question: typeof item.question === "string" ? item.question.trim() : "",
          options,
          correctAnswer: typeof item.correctAnswer === "string" ? item.correctAnswer.trim() : "",
          explanation: typeof item.explanation === "string" ? item.explanation.trim() : "",
        };
      })
      .filter((item) =>
        item.question &&
        item.options.length === 4 &&
        item.correctAnswer &&
        item.options.includes(item.correctAnswer)
      )
      .slice(0, count),
  };
};

export const validateRecommendationReasons = (data) => {
  const reasons = Array.isArray(data.reasons) ? data.reasons : [];
  return reasons
    .map((item) => ({
      courseId: typeof item.courseId === "string" ? item.courseId : "",
      reason: typeof item.reason === "string" ? item.reason.trim() : "",
    }))
    .filter((item) => item.courseId && item.reason);
};

