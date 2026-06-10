import { AppError } from "../middleware/error.middleware.js";

export const normalizeId = (value) => value?._id?.toString?.() || value?.toString?.() || "";

export const isCourseCreator = (course, user) => {
  if (!course || !user) return false;
  return normalizeId(course.instructor) === normalizeId(user.id || user._id);
};

export const assertCourseCreator = (course, user, message = "You are not authorized to manage this course") => {
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  if (!isCourseCreator(course, user)) {
    throw new AppError(message, 403);
  }
};
