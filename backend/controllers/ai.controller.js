import { catchAsync } from "../middleware/error.middleware.js";
import {
  answerLessonQuestion,
  generateLessonQuiz,
  generateLessonSummary,
  getCourseRecommendations,
} from "../services/ai/ai.service.js";

export const summarizeLesson = catchAsync(async (req, res) => {
  const data = await generateLessonSummary({
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
    user: req.user,
  });
  res.status(200).json({ success: true, data });
});

export const askAboutLesson = catchAsync(async (req, res) => {
  const data = await answerLessonQuestion({
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
    question: req.body.question,
    user: req.user,
  });
  res.status(200).json({ success: true, data });
});

export const generateQuiz = catchAsync(async (req, res) => {
  const data = await generateLessonQuiz({
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
    count: req.body.count,
    user: req.user,
  });
  res.status(200).json({ success: true, data });
});

export const recommendCourses = catchAsync(async (req, res) => {
  const data = await getCourseRecommendations({
    user: req.user,
    limit: req.query.limit,
  });
  res.status(200).json({ success: true, data });
});

