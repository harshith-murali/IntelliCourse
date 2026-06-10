import { CourseProgress } from "../models/courseProgress.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";

const ensureCourseAccess = async (courseId, userId) => {
  const course = await Course.findById(courseId).populate({
    path: "lectures",
    options: { sort: { order: 1 } }
  });
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const isOwner = course.instructor.toString() === userId;
  const purchase = isOwner ? true : await CoursePurchase.exists({
    user: userId,
    course: courseId,
    status: "completed"
  });

  if (!purchase && !isOwner) {
    throw new AppError("You must own this course to view progress", 403);
  }

  return course;
};

const syncProgressLectures = async (progress, lectures) => {
  const courseLectureIds = lectures.map(lecture => lecture._id.toString());
  progress.lectureProgress = progress.lectureProgress.filter(lp =>
    courseLectureIds.includes(lp.lecture.toString())
  );

  const progressLectureIds = progress.lectureProgress.map(lp => lp.lecture.toString());
  lectures.forEach(lecture => {
    if (!progressLectureIds.includes(lecture._id.toString())) {
      progress.lectureProgress.push({
        lecture: lecture._id,
        isCompleted: false,
        watchTime: 0
      });
    }
  });
};

/**
 * Get user's progress for a specific course
 * @route GET /api/v1/progress/:courseId
 */
export const getUserCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const course = await ensureCourseAccess(courseId, userId);

  // Find or create course progress record
  let progress = await CourseProgress.findOne({ user: userId, course: courseId });
  
  if (!progress) {
    // Initialize progress for all course lectures
    const lectureProgress = course.lectures.map(lecture => ({
      lecture: lecture._id,
      isCompleted: false,
      watchTime: 0
    }));

    progress = await CourseProgress.create({
      user: userId,
      course: courseId,
      lectureProgress
    });
  } else {
    // If new lectures have been added to the course, sync them to progress
    const beforeCount = progress.lectureProgress.length;
    await syncProgressLectures(progress, course.lectures);
    if (beforeCount !== progress.lectureProgress.length) {
      await progress.save();
    }
  }

  const completedLectures = progress.lectureProgress.filter(lp => lp.isCompleted).length;

  res.status(200).json({
    success: true,
    data: {
      ...progress.toObject(),
      completedLectures,
      totalLectures: course.lectures.length
    }
  });
});

/**
 * Update progress for a specific lecture
 * @route PATCH /api/v1/progress/:courseId/lectures/:lectureId
 */
export const updateLectureProgress = catchAsync(async (req, res) => {
  const { courseId, lectureId } = req.params;
  const { isCompleted, watchTime } = req.body;
  const userId = req.user.id;

  const course = await ensureCourseAccess(courseId, userId);
  const lecture = course.lectures.find(l => l._id.toString() === lectureId);
  if (!lecture) {
    throw new AppError("Lecture does not belong to this course", 400);
  }

  let progress = await CourseProgress.findOne({ user: userId, course: courseId });
  if (!progress) {
    progress = await CourseProgress.create({
      user: userId,
      course: courseId,
      lectureProgress: course.lectures.map(l => ({
        lecture: l._id,
        isCompleted: false,
        watchTime: 0
      }))
    });
  } else {
    await syncProgressLectures(progress, course.lectures);
  }

  const numericWatchTime = Number(watchTime);
  const hasWatchTime = Number.isFinite(numericWatchTime) && numericWatchTime >= 0;
  const watchedEnough = hasWatchTime && lecture.duration > 0 && numericWatchTime / lecture.duration >= 0.9;
  const nextCompleted = isCompleted !== undefined ? Boolean(isCompleted) : watchedEnough;

  // Find lecture progress in array
  const lpIndex = progress.lectureProgress.findIndex(lp => lp.lecture.toString() === lectureId);
  if (lpIndex === -1) {
    // If not found in progress array, push it
    progress.lectureProgress.push({
      lecture: lectureId,
      isCompleted: nextCompleted,
      watchTime: hasWatchTime ? numericWatchTime : 0,
      lastWatched: Date.now(),
      completedAt: nextCompleted ? Date.now() : undefined
    });
  } else {
    if (isCompleted !== undefined || watchedEnough) {
      progress.lectureProgress[lpIndex].isCompleted = nextCompleted;
      progress.lectureProgress[lpIndex].completedAt = nextCompleted ? (progress.lectureProgress[lpIndex].completedAt || Date.now()) : undefined;
    }
    if (hasWatchTime) {
      progress.lectureProgress[lpIndex].watchTime = Math.max(progress.lectureProgress[lpIndex].watchTime || 0, numericWatchTime);
    }
    progress.lectureProgress[lpIndex].lastWatched = Date.now();
  }

  progress.lastAccessed = Date.now();
  await progress.save();

  res.status(200).json({
    success: true,
    message: "Lecture progress updated successfully",
    data: {
      ...progress.toObject(),
      completedLectures: progress.lectureProgress.filter(lp => lp.isCompleted).length,
      totalLectures: course.lectures.length
    }
  });
});

/**
 * Mark entire course as completed
 * @route PATCH /api/v1/progress/:courseId/complete
 */
export const markCourseAsCompleted = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  await ensureCourseAccess(courseId, userId);
  let progress = await CourseProgress.findOne({ user: userId, course: courseId });
  if (!progress) {
    throw new AppError("Progress record not found", 404);
  }

  progress.lectureProgress.forEach(lp => {
    lp.isCompleted = true;
  });

  progress.isCompleted = true;
  progress.completionPercentage = 100;
  progress.lastAccessed = Date.now();
  await progress.save();

  res.status(200).json({
    success: true,
    message: "Course marked as completed",
    data: progress
  });
});

/**
 * Reset course progress
 * @route PATCH /api/v1/progress/:courseId/reset
 */
export const resetCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  await ensureCourseAccess(courseId, userId);
  let progress = await CourseProgress.findOne({ user: userId, course: courseId });
  if (!progress) {
    throw new AppError("Progress record not found", 404);
  }

  progress.lectureProgress.forEach(lp => {
    lp.isCompleted = false;
    lp.watchTime = 0;
  });

  progress.isCompleted = false;
  progress.completionPercentage = 0;
  progress.lastAccessed = Date.now();
  await progress.save();

  res.status(200).json({
    success: true,
    message: "Course progress reset successfully",
    data: progress
  });
});
