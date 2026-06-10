import express from "express";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";
import {
  createNewCourse,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourse,
  getCourseLectures,
  deleteLectureFromCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);

// Protected routes
router.use(isAuthenticated);

// Course management
router
  .route("/")
  .post(restrictTo("instructor", "admin"), upload.single("thumbnail"), createNewCourse)
  .get(restrictTo("instructor", "admin"), getMyCreatedCourses);

// Course details and updates
router
  .route("/c/:courseId")
  .get(getCourseDetails)
  .patch(
    restrictTo("instructor", "admin"),
    upload.single("thumbnail"),
    updateCourseDetails
  )
  .delete(restrictTo("instructor", "admin"), deleteCourse);

// Lecture management
router
  .route("/c/:courseId/lectures")
  .get(getCourseLectures)
  .post(restrictTo("instructor", "admin"), upload.single("video"), addLectureToCourse);

router
  .route("/c/:courseId/lectures/:lectureId")
  .delete(restrictTo("instructor", "admin"), deleteLectureFromCourse);

export default router;
