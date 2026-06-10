import { Course } from "../../models/course.model.js";
import { CoursePurchase } from "../../models/coursePurchase.model.js";
import { CourseProgress } from "../../models/courseProgress.js";
import { User } from "../../models/user.model.js";
import { AppError } from "../../middleware/error.middleware.js";
import { signCourseThumbnails } from "../../utils/courseDto.js";
import { isCourseCreator } from "../../utils/courseAuthorization.js";
import { callClaudeJson, isClaudeConfigured } from "./claudeClient.js";
import {
  buildAskPrompt,
  buildQuizPrompt,
  buildRecommendationReasonsPrompt,
  buildSummaryPrompt,
} from "./promptBuilders.js";
import {
  validateAskResponse,
  validateQuizResponse,
  validateRecommendationReasons,
  validateSummaryResponse,
} from "./validators.js";

const normalizeId = (value) => value?._id?.toString?.() || value?.toString?.() || "";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "your", "you", "are", "was", "were", "course",
  "lesson", "learn", "about", "into", "will", "can", "how", "what", "why", "use", "using", "to", "of", "in",
]);

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const tokenOverlapScore = (course, profileTokens) => {
  if (!profileTokens.size) return 0;
  const courseTokens = new Set(tokenize(`${course.title} ${course.subtitle || ""} ${course.description || ""} ${course.category || ""}`));
  let matches = 0;
  profileTokens.forEach((token) => {
    if (courseTokens.has(token)) matches += 1;
  });
  return Math.min(matches * 4, 24);
};

const getCourseWithLesson = async (courseId, lessonId, user) => {
  const course = await Course.findById(courseId)
    .populate("instructor", "name role")
    .populate({ path: "lectures", options: { sort: { order: 1 } } });

  if (!course) throw new AppError("Course not found", 404);

  const lesson = course.lectures.find((lecture) => lecture._id.toString() === lessonId);
  if (!lesson) throw new AppError("Lesson does not belong to this course", 404);

  const isOwner = isCourseCreator(course, user);
  const purchase = isOwner ? true : await CoursePurchase.exists({
    user: user.id,
    course: courseId,
    status: "completed",
  });

  if (!purchase && !isOwner) {
    throw new AppError("You must be enrolled in this course to use AI for this lesson", 403);
  }

  return { course, lesson };
};

const buildLessonContext = (course, lesson) => {
  const lectures = course.lectures || [];
  const lessonIndex = lectures.findIndex((item) => item._id.toString() === lesson._id.toString());
  const nearbyLessons = lectures
    .filter((_, index) => Math.abs(index - lessonIndex) <= 1 && index !== lessonIndex)
    .map((item) => item.title)
    .filter(Boolean);

  const transcript = lesson.transcript?.trim() || "";
  const notes = lesson.notes?.trim() || "";
  const description = lesson.description?.trim() || "";
  const courseDescription = course.description?.trim() || "";
  const metadataFallback = [
    `Course: ${course.title}`,
    course.subtitle ? `Subtitle: ${course.subtitle}` : "",
    course.category ? `Category: ${course.category}` : "",
    course.level ? `Level: ${course.level}` : "",
    `Lesson: ${lesson.title}`,
    lesson.order ? `Lesson order: ${lesson.order}` : "",
    nearbyLessons.length ? `Nearby lessons: ${nearbyLessons.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  let primarySource = "metadata";
  if (transcript) primarySource = "transcript";
  else if (notes) primarySource = "notes";
  else if (description) primarySource = "description";
  else if (courseDescription) primarySource = "course description";

  const richContentLength = `${transcript} ${notes} ${description} ${courseDescription}`.trim().length;
  const contextQuality = richContentLength >= 300
    ? "rich"
    : richContentLength >= 80
      ? "moderate"
      : "metadata-only";

  return {
    courseTitle: course.title,
    courseSubtitle: course.subtitle || "",
    courseDescription,
    courseCategory: course.category || "",
    courseLevel: course.level || "",
    lessonTitle: lesson.title,
    lessonDescription: description,
    lessonOrder: lesson.order,
    nearbyLessons,
    transcript,
    notes,
    metadataFallback,
    primarySource,
    contextQuality,
  };
};

const callWithJsonRetry = async (prompt, validator, fallback, options = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await callClaudeJson({ ...prompt, ...options });
      const validated = validator(data);
      if (fallback && fallback(validated)) {
        throw new Error("Claude returned incomplete JSON");
      }
      return validated;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const generateLessonSummary = async ({ courseId, lessonId, user }) => {
  const { course, lesson } = await getCourseWithLesson(courseId, lessonId, user);
  const context = buildLessonContext(course, lesson);

  const prompt = buildSummaryPrompt(context);
  return callWithJsonRetry(
    prompt,
    validateSummaryResponse,
    (value) => !value.summary,
    { maxTokens: 700 }
  );
};

export const answerLessonQuestion = async ({ courseId, lessonId, question, user }) => {
  const { course, lesson } = await getCourseWithLesson(courseId, lessonId, user);
  const context = buildLessonContext(course, lesson);

  if (!question || question.trim().length < 3) {
    throw new AppError("Question must be at least 3 characters long", 400);
  }

  const prompt = buildAskPrompt(context, question.trim());
  return callWithJsonRetry(
    prompt,
    validateAskResponse,
    (value) => !value.answer,
    { maxTokens: 900 }
  );
};

export const generateLessonQuiz = async ({ courseId, lessonId, count, user }) => {
  const { course, lesson } = await getCourseWithLesson(courseId, lessonId, user);
  const context = buildLessonContext(course, lesson);
  const quizCount = Math.min(Math.max(Number(count) || 5, 1), 10);

  const prompt = buildQuizPrompt(context, quizCount);
  return callWithJsonRetry(
    prompt,
    (data) => validateQuizResponse(data, quizCount),
    (value) => value.questions.length === 0,
    { maxTokens: 1500 }
  );
};

const getLearnerSignals = async (userId) => {
  const user = await User.findById(userId).populate("enrolledCourses.course");
  const purchases = await CoursePurchase.find({ user: userId, status: "completed" }).populate("course");
  const purchasedCourses = purchases.map((purchase) => purchase.course).filter(Boolean);
  const progressRecords = await CourseProgress.find({ user: userId }).populate("course");

  const categoryWeights = new Map();
  const tokenWeights = new Map();
  const levels = [];
  const enrolledIds = new Set();
  const completedCourseIds = new Set();

  const addWeight = (map, key, amount) => {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + amount);
  };

  const addCourseSignals = (course, amount = 1) => {
    if (!course) return;
    enrolledIds.add(course._id.toString());
    addWeight(categoryWeights, course.category, amount);
    if (course.level) levels.push(course.level);
    tokenize(`${course.title} ${course.subtitle || ""} ${course.description || ""} ${course.category || ""}`)
      .forEach((token) => addWeight(tokenWeights, token, amount));
  };

  user?.enrolledCourses?.forEach((entry) => addCourseSignals(entry.course, 1));
  purchasedCourses.forEach((course) => addCourseSignals(course, 2));

  progressRecords.forEach((progress) => {
    const progressBoost = progress.completionPercentage >= 80 ? 3 : progress.completionPercentage >= 25 ? 2 : 1;
    addCourseSignals(progress.course, progressBoost);
    if (progress.isCompleted || progress.completionPercentage >= 100) {
      completedCourseIds.add(progress.course?._id?.toString());
    }
  });

  const categories = [...categoryWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
  const profileTokens = new Set(
    [...tokenWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([token]) => token)
  );

  return {
    enrolledIds,
    completedCourseIds,
    categories,
    categoryWeights,
    levels,
    profileTokens,
    hasActivity: purchasedCourses.length > 0 || progressRecords.length > 0,
  };
};

const scoreCourse = (course, signals) => {
  let score = 12;
  const reasons = [];

  const categoryWeight = signals.categoryWeights.get(course.category) || 0;
  if (categoryWeight > 0) {
    score += Math.min(20 + categoryWeight * 12, 48);
    reasons.push(`Matches your recent ${course.category} learning`);
  }

  if (signals.levels.includes("beginner") && course.level === "intermediate") {
    score += 18;
    reasons.push("A good next step after beginner-level courses");
  } else if (signals.levels.includes(course.level)) {
    score += 12;
    reasons.push(`Fits your ${course.level} learning level`);
  } else if (!signals.levels.length && course.level === "beginner") {
    score += 12;
    reasons.push("Beginner-friendly starting point");
  }

  const similarity = tokenOverlapScore(course, signals.profileTokens);
  if (similarity > 0) {
    score += similarity;
    if (!reasons.length) reasons.push("Related to topics in your learning history");
  }

  if (course.price === 0) {
    score += 4;
  } else if (signals.levels.includes(course.level)) {
    score += 2;
  }

  const studentCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0;
  score += Math.min(studentCount * 3, 18);
  if (studentCount > 0) reasons.push("Popular with other learners");

  const createdAtScore = course.createdAt
    ? Math.max(0, 8 - Math.floor((Date.now() - course.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  score += createdAtScore;

  if (!reasons.length) {
    reasons.push(signals.hasActivity ? "Broadens your learning path" : "Good course to start your learning path");
  }

  return { score: Math.round(clamp(score, 0, 100)), reason: reasons[0], reasonSignals: reasons.slice(0, 3) };
};

export const getCourseRecommendations = async ({ user, limit = 6 }) => {
  if (user.role !== "student") {
    throw new AppError("Recommendations are available for learner accounts only", 403);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 10);
  const signals = await getLearnerSignals(user.id);

  const courseDocs = await Course.find({
    isPublished: true,
    _id: { $nin: [...signals.enrolledIds] },
  })
    .populate("instructor", "name avatar bio")
    .sort({ createdAt: -1 })
    .limit(50);

  const courses = await signCourseThumbnails(courseDocs);

  const recommendations = courses
    .map((course) => {
      const { score, reason, reasonSignals } = scoreCourse(course, signals);
      const thumbnail = course.coverImageUrl || course.thumbnailUrl || course.thumbnail;
      return {
        courseId: normalizeId(course._id),
        title: course.title,
        subtitle: course.subtitle || course.description || "",
        thumbnail,
        thumbnailUrl: thumbnail,
        coverImageUrl: thumbnail,
        thumbnailKey: course.thumbnailKey,
        category: course.category,
        level: course.level,
        price: course.price,
        students: Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0,
        reason,
        score,
        reasonSignals,
        course,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);

  if (recommendations.length && isClaudeConfigured()) {
    try {
      const prompt = buildRecommendationReasonsPrompt({
        profile: {
          categories: signals.categories,
          levels: signals.levels,
          enrolledCourseCount: signals.enrolledIds.size,
          completedCourseCount: signals.completedCourseIds.size,
        },
        courses: recommendations.map(({ course, ...item }) => item),
      });
      const data = await callClaudeJson({ ...prompt, maxTokens: 700, temperature: 0.1 });
      const reasons = validateRecommendationReasons(data);
      const reasonMap = new Map(reasons.map((item) => [item.courseId, item.reason]));
      recommendations.forEach((item) => {
        item.reason = reasonMap.get(item.courseId) || item.reason;
      });
    } catch {
      // Keep deterministic rule-based reasons if Claude is unavailable.
    }
  }

  return {
    recommendations: recommendations.map(({ course, reasonSignals, ...item }) => item),
  };
};
