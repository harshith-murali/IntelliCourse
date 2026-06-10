import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";
import { MediaAsset } from "../models/mediaAsset.model.js";
import { uploadLocalFileToS3, deleteFileFromS3 } from "../services/s3.service.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { signCourseThumbnail, signCourseThumbnails } from "../utils/courseDto.js";
import { assertCourseCreator } from "../utils/courseAuthorization.js";

/**
 * Create a new course
 * @route POST /api/v1/course/
 */
export const createNewCourse = catchAsync(async (req, res) => {
  const { title, subtitle, description, category, level, price } = req.body;

  let thumbnailUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&h=540&fit=crop';
  let thumbnailKey;
  
  if (req.file) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    thumbnailKey = `courses/thumbnails/${Date.now()}-${req.file.originalname}`;
    thumbnailUrl = await uploadLocalFileToS3(req.file.path, bucketName, thumbnailKey, req.file.mimetype);
  }

const course = await Course.create({
    title,
    subtitle,
    description,
    category,
    level,
    price: price || 0,
    thumbnail: thumbnailUrl,
    thumbnailUrl,
    thumbnailKey,
    instructor: req.user.id,
    isPublished: true
  });

  // Add course to instructor's created courses
  await User.findByIdAndUpdate(req.user.id, {
    $push: { createdCourses: course._id }
  });

  const populatedCourse = await Course.findById(course._id).populate("instructor", "name avatar bio");
  const signedCourse = await signCourseThumbnail(populatedCourse);

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: signedCourse
  });
});

const asBoolean = (value) => value === true || value === "true" || value === "1";

const courseHasLecture = (course, lectureId) =>
  course.lectures.some((id) => id.toString() === lectureId);

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const parseResources = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeResources = (resources) =>
  resources
    .map((resource) => ({
      title: String(resource?.title || "").trim(),
      url: String(resource?.url || "").trim(),
    }))
    .filter((resource) => resource.url);

const buildLecturePayload = (body, fallbackOrder) => {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const sectionTitle = String(body.sectionTitle || "").trim();
  const sectionId = String(body.sectionId || "").trim();
  const order = Number(body.order || fallbackOrder);
  const durationValue = body.durationSeconds ?? body.duration;
  const duration = Number(durationValue || 0);
  const tags = parseList(body.tags).slice(0, 12);
  const objectives = parseList(body.objectives).slice(0, 8);
  const resources = normalizeResources(parseResources(body.resources).slice(0, 10));

  if (!title) throw new AppError("Lecture title is required", 400);
  if (!description) throw new AppError("Lecture description is required", 400);
  if (!sectionTitle && !sectionId) throw new AppError("Section title or sectionId is required", 400);
  if (!Number.isFinite(order) || order <= 0) throw new AppError("Lecture order must be a positive number", 400);
  if (!Number.isFinite(duration) || duration < 0) throw new AppError("Lecture duration must be zero or greater", 400);
  if (!tags.length) throw new AppError("At least one lecture tag or keyword is required", 400);

  return {
    title,
    description,
    sectionTitle: sectionTitle || "General",
    sectionId,
    order,
    duration,
    notes: String(body.notes || "").trim(),
    transcript: String(body.transcript || "").trim(),
    thumbnailUrl: String(body.thumbnailUrl || "").trim(),
    thumbnailKey: String(body.thumbnailKey || "").trim(),
    isPreview: asBoolean(body.isPreview ?? body.freePreview),
    tags,
    difficulty: ["beginner", "intermediate", "advanced"].includes(body.difficulty) ? body.difficulty : "beginner",
    objectives,
    resources,
  };
};

/**
 * Search courses with filters
 * @route GET /api/v1/course/search
 */
export const searchCourses = catchAsync(async (req, res) => {
  const { query, category, level, minPrice, maxPrice, sortBy } = req.query;
  const filter = { isPublished: true };

  // Search by text query
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { subtitle: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } }
    ];
  }

  // Filter by category
  if (category && category !== "All") {
    filter.category = category;
  }

  // Filter by level
  if (level) {
    filter.level = level;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === "price-low-high") sortOption = { price: 1 };
  if (sortBy === "price-high-low") sortOption = { price: -1 };
  if (sortBy === "popular") sortOption = { enrolledStudents: -1 };

  const courses = await Course.find(filter)
    .populate("instructor", "name avatar bio")
    .sort(sortOption);
  const signedCourses = await signCourseThumbnails(courses);

  res.status(200).json({
    success: true,
    count: signedCourses.length,
    data: signedCourses
  });
});

/**
 * Get all published courses
 * @route GET /api/v1/course/published
 */
export const getPublishedCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ isPublished: true }).populate("instructor", "name avatar bio");
  const signedCourses = await signCourseThumbnails(courses);
  res.status(200).json({
    success: true,
    count: signedCourses.length,
    data: signedCourses
  });
});

/**
 * Get courses created by the current instructor
 * @route GET /api/v1/course/ (GET with role check)
 */
export const getMyCreatedCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id })
    .populate("instructor", "name avatar bio")
    .populate("lectures");

  const signedCourses = await signCourseThumbnails(courses);
  res.status(200).json({
    success: true,
    count: signedCourses.length,
    data: signedCourses
  });
});

/**
 * Update course details
 * @route PATCH /api/v1/course/c/:courseId
 */
export const updateCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, subtitle, description, category, level, price, isPublished, thumbnailUrl, thumbnailKey } = req.body;

  const course = await Course.findById(courseId);
  assertCourseCreator(course, req.user);

  const updateData = {};
  if (title) updateData.title = title;
  if (subtitle) updateData.subtitle = subtitle;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (level) updateData.level = level;
  if (price !== undefined) updateData.price = Number(price);
  if (isPublished !== undefined) updateData.isPublished = (isPublished === 'true' || isPublished === true);

  if (thumbnailUrl !== undefined) {
    updateData.thumbnail = thumbnailUrl;
    updateData.thumbnailUrl = thumbnailUrl;
  }
  if (thumbnailKey !== undefined) {
    updateData.thumbnailKey = thumbnailKey;
    
    // If thumbnail is replaced, delete the old one from S3
    if (course.thumbnailKey && course.thumbnailKey !== thumbnailKey) {
      try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
        await deleteFileFromS3(bucketName, course.thumbnailKey);
        console.log(`Successfully deleted old course thumbnail: ${course.thumbnailKey}`);
      } catch (err) {
        console.error(`Failed to delete old thumbnail for key ${course.thumbnailKey}:`, err);
      }
    }
  }

  if (req.file) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const key = `courses/thumbnails/${courseId}-${Date.now()}-${req.file.originalname}`;
    updateData.thumbnail = await uploadLocalFileToS3(req.file.path, bucketName, key, req.file.mimetype);
    updateData.thumbnailUrl = updateData.thumbnail;
    updateData.thumbnailKey = key;
    
    // Delete old thumbnail if it existed
    if (course.thumbnailKey) {
      try {
        await deleteFileFromS3(bucketName, course.thumbnailKey);
        console.log(`Successfully deleted old course thumbnail: ${course.thumbnailKey}`);
      } catch (err) {
        console.error(`Failed to delete old thumbnail for key ${course.thumbnailKey}:`, err);
      }
    }
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    updateData,
    { new: true, runValidators: true }
  ).populate("lectures").populate("instructor", "name avatar bio");

  const signedCourse = await signCourseThumbnail(updatedCourse);

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: signedCourse
  });
});

/**
 * Get course by ID
 * @route GET /api/v1/course/c/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate("instructor", "name avatar bio")
    .populate({
      path: "lectures",
      options: { sort: { order: 1 } }
    });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const signedCourse = await signCourseThumbnail(course);

  res.status(200).json({
    success: true,
    data: signedCourse
  });
});

/**
 * Add lecture to course (Fallback Multipart Upload)
 * @route POST /api/v1/course/c/:courseId/lectures
 */
export const addLectureToCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  assertCourseCreator(course, req.user);

  const lecturePayload = buildLecturePayload(req.body, course.lectures.length + 1);
  let videoUrl = "";
  let s3Key = "";

  if (req.file) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    s3Key = `courses/${courseId}/lectures/${Date.now()}-${req.file.originalname}`;
    videoUrl = await uploadLocalFileToS3(req.file.path, bucketName, s3Key, req.file.mimetype);
  }

  const lecture = await Lecture.create({
    ...lecturePayload,
    videoUrl,
    s3Key,
  });

  // Link lecture to course
  await Course.findByIdAndUpdate(courseId, {
    $push: { lectures: lecture._id }
  });

  res.status(201).json({
    success: true,
    message: "Lecture added successfully",
    data: lecture
  });
});

/**
 * Get course lectures
 * @route GET /api/v1/course/c/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId).populate({
    path: "lectures",
    options: { sort: { order: 1 } }
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({
    success: true,
    data: course.lectures
  });
});

/**
 * Delete a lecture from a course
 * @route DELETE /api/v1/course/c/:courseId/lectures/:lectureId
 */
export const deleteLectureFromCourse = catchAsync(async (req, res) => {
  const { courseId, lectureId } = req.params;

  // 1. Verify course exists and current user is the owner (instructor)
  const course = await Course.findById(courseId);
  assertCourseCreator(course, req.user);

  // 2. Find the lecture
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new AppError("Lecture not found", 404);
  }
  if (!courseHasLecture(course, lectureId)) {
    throw new AppError("Lecture does not belong to this course", 404);
  }

  // 3. Delete associated video from S3 if s3Key exists
  if (lecture.s3Key) {
    try {
      const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
      await deleteFileFromS3(bucketName, lecture.s3Key);
      console.log(`Successfully deleted video object for key: ${lecture.s3Key}`);
    } catch (s3Err) {
      console.error(`Failed to delete video file for key ${lecture.s3Key}:`, s3Err);
    }
  }

  // 4. Delete the MediaAsset document if it exists
  if (lecture.mediaAsset) {
    await MediaAsset.findByIdAndDelete(lecture.mediaAsset);
  }

  // 5. Pull the lecture from Course lectures array
  await Course.findByIdAndUpdate(courseId, {
    $pull: { lectures: lectureId }
  });

  // 6. Delete the Lecture document
  await Lecture.findByIdAndDelete(lectureId);

  res.status(200).json({
    success: true,
    message: "Lecture and video deleted successfully"
  });
});

/**
 * Delete a course and its lectures
 * @route DELETE /api/v1/course/c/:courseId
 */
export const deleteCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId).populate("lectures");
  assertCourseCreator(course, req.user);

  for (const lecture of course.lectures) {
    if (lecture.s3Key) {
      try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
        await deleteFileFromS3(bucketName, lecture.s3Key);
      } catch (err) {
        console.error(`Failed to delete video file for key ${lecture.s3Key}:`, err);
      }
    }
    if (lecture.mediaAsset) {
      await MediaAsset.findByIdAndDelete(lecture.mediaAsset);
    }
    await Lecture.findByIdAndDelete(lecture._id);
  }

  await User.findByIdAndUpdate(course.instructor, { $pull: { createdCourses: courseId } });
  await Course.findByIdAndDelete(courseId);

  res.status(200).json({
    success: true,
    message: "Course deleted successfully"
  });
});
