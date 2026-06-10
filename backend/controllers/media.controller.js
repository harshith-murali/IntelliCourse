import { MediaAsset } from "../models/mediaAsset.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { getPresignedUploadUrl, getPresignedPlaybackUrl } from "../services/s3.service.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";
import { assertCourseCreator, isCourseCreator } from "../utils/courseAuthorization.js";

/**
 * Generate a presigned upload URL for uploading a video file
 * @route POST /api/v1/media/presigned-upload
 */
export const requestPresignedUploadUrl = catchAsync(async (req, res) => {
    const { fileName, fileType, fileSize, courseId } = req.body;

    if (!fileName || !fileType || !fileSize || !courseId) {
        throw new AppError("fileName, fileType, fileSize, and courseId are required", 400);
    }

    const size = Number(fileSize);
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedVideoTypes.includes(fileType)) {
        throw new AppError("Invalid file type. Only MP4, WEBM, and MOV videos are allowed.", 400);
    }
    if (!Number.isFinite(size) || size <= 0 || size > 1024 * 1024 * 1024) {
        throw new AppError("Video must be smaller than 1GB", 400);
    }

    // Verify course exists and user is the creator of the course.
    const course = await Course.findById(courseId);
    assertCourseCreator(course, req.user, "You are not authorized to upload content to this course");

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `courses/${courseId}/lectures/${timestamp}-${cleanFileName}`;

    // Create a pending MediaAsset record
    const asset = await MediaAsset.create({
        owner: req.user.id,
        s3Key: key,
        bucketName,
        fileType,
        fileSize,
        processingStatus: 'pending'
    });

    const uploadUrl = await getPresignedUploadUrl(bucketName, key, fileType);

    res.status(200).json({
        success: true,
        data: {
            mediaAssetId: asset._id,
            uploadUrl,
            s3Key: key,
            rawUrl: `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
        }
    });
});

/**
 * Confirm upload completion and link to lecture
 * @route POST /api/v1/media/confirm-upload
 */
export const confirmUpload = catchAsync(async (req, res) => {
    const { mediaAssetId, lectureId, duration } = req.body;

    if (!mediaAssetId || !lectureId) {
        throw new AppError("mediaAssetId and lectureId are required", 400);
    }

    const asset = await MediaAsset.findOne({ _id: mediaAssetId, owner: req.user.id });
    if (!asset) {
        throw new AppError("Media asset not found or not owned by current user", 404);
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        throw new AppError("Lecture not found", 404);
    }

    const course = await Course.findOne({ lectures: lectureId });
    assertCourseCreator(course, req.user, "You are not authorized to confirm uploads for this course");

    // Update asset status only after both asset ownership and course ownership are verified.
    const durationSeconds = Number(duration);
    const hasDuration = Number.isFinite(durationSeconds) && durationSeconds > 0;
    asset.processingStatus = 'ready';
    asset.duration = hasDuration ? durationSeconds : asset.duration || 0;
    asset.rawUrl = `https://${asset.bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${asset.s3Key}`;
    await asset.save();

    // Link asset to lecture
    lecture.mediaAsset = asset._id;
    lecture.videoUrl = asset.rawUrl;
    lecture.s3Key = asset.s3Key;
    if (hasDuration) {
        lecture.duration = durationSeconds;
    }
    await lecture.save();

    res.status(200).json({
        success: true,
        message: "Upload confirmed and video linked to lecture",
        data: lecture
    });
});

/**
 * Request protected playback URL for a specific lecture (Authorized only)
 * @route GET /api/v1/media/play/c/:courseId/l/:lectureId
 */
export const getLecturePlaybackUrl = catchAsync(async (req, res) => {
    const { courseId, lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        throw new AppError("Lecture not found", 404);
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new AppError("Course not found", 404);
    }
    if (!course.lectures.some((id) => id.toString() === lectureId)) {
        throw new AppError("Lecture does not belong to this course", 404);
    }

    // Authorization checks:
    // 1. Is this a free preview lecture?
    // 2. Is the user the course creator?
    // 3. Has the user purchased/enrolled in the course?
    let isAuthorized = lecture.isPreview;

    if (!isAuthorized) {
        if (isCourseCreator(course, req.user)) {
            isAuthorized = true;
        } else {
            const enrollment = await CoursePurchase.findOne({
                user: req.user.id,
                course: courseId,
                status: 'completed'
            });
            if (enrollment) {
                isAuthorized = true;
            }
        }
    }

    if (!isAuthorized) {
        throw new AppError("You must enroll in this course to watch this lecture", 403);
    }

    // Get the S3 Key (fallback to direct URL if not uploaded via S3 yet)
    const key = lecture.s3Key;
    if (!key) {
        return res.status(200).json({
            success: true,
            data: {
                playbackUrl: lecture.videoUrl || "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4"
            }
        });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const playbackUrl = await getPresignedPlaybackUrl(bucketName, key);

    res.status(200).json({
        success: true,
        data: {
            playbackUrl
        }
    });
});

/**
 * Generate a presigned upload URL for uploading a course thumbnail image
 * @route POST /api/v1/media/presigned-thumbnail
 */
export const requestPresignedThumbnailUrl = catchAsync(async (req, res) => {
    const { fileName, fileType, fileSize, courseId } = req.body;

    if (!fileName || !fileType || !courseId) {
        throw new AppError("fileName, fileType, and courseId are required", 400);
    }

    // Validate MIME types
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(fileType)) {
        throw new AppError("Invalid file type. Only JPEG, PNG, and WEBP images are allowed.", 400);
    }
    const size = Number(fileSize || 0);
    if (fileSize !== undefined && (!Number.isFinite(size) || size <= 0 || size > 5 * 1024 * 1024)) {
        throw new AppError("Thumbnail must be smaller than 5MB", 400);
    }

    // Verify course exists and user is the creator of the course.
    const course = await Course.findById(courseId);
    assertCourseCreator(course, req.user, "You are not authorized to update this course's thumbnail");

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `courses/${courseId}/thumbnail/${timestamp}-${cleanFileName}`;

    const uploadUrl = await getPresignedUploadUrl(bucketName, key, fileType);

    res.status(200).json({
        success: true,
        data: {
            uploadUrl,
            s3Key: key,
            rawUrl: `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
        }
    });
});
