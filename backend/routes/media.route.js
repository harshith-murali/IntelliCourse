import express from "express";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";
import {
    requestPresignedUploadUrl,
    confirmUpload,
    getLecturePlaybackUrl,
    requestPresignedThumbnailUrl
} from "../controllers/media.controller.js";

const router = express.Router();

// Instructor thumbnail upload presigned generation
router.post(
    "/presigned-thumbnail",
    isAuthenticated,
    restrictTo("instructor", "admin"),
    requestPresignedThumbnailUrl
);

// Instructor upload presigned generation
router.post(
    "/presigned-upload",
    isAuthenticated,
    restrictTo("instructor", "admin"),
    requestPresignedUploadUrl
);

// Instructor upload finalization
router.post(
    "/confirm-upload",
    isAuthenticated,
    restrictTo("instructor", "admin"),
    confirmUpload
);

// Secure video streaming
router.get(
    "/play/c/:courseId/l/:lectureId",
    isAuthenticated,
    getLecturePlaybackUrl
);

export default router;
