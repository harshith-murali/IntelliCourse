import express from "express";
import { body, query } from "express-validator";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  askAboutLesson,
  generateQuiz,
  recommendCourses,
  summarizeLesson,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.use(isAuthenticated);

const lessonRequestValidation = [
  body("courseId").isMongoId().withMessage("Valid courseId is required"),
  body("lessonId").isMongoId().withMessage("Valid lessonId is required"),
];

router.post("/summary", validate(lessonRequestValidation), summarizeLesson);

router.post(
  "/ask",
  validate([
    ...lessonRequestValidation,
    body("question").trim().isLength({ min: 3, max: 600 }).withMessage("Question must be 3 to 600 characters"),
  ]),
  askAboutLesson
);

router.post(
  "/quiz",
  validate([
    ...lessonRequestValidation,
    body("count").optional().isInt({ min: 1, max: 10 }).withMessage("Count must be between 1 and 10"),
  ]),
  generateQuiz
);

router.get(
  "/recommendations",
  validate([query("limit").optional().isInt({ min: 1, max: 10 }).withMessage("Limit must be between 1 and 10")]),
  recommendCourses
);

export default router;
