import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { uploadLocalFileToS3 } from "../services/s3.service.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { serializeUser, serializeUserAsync } from "../utils/courseDto.js";
import crypto from "crypto";

/**
 * Create a new user account
 * @route POST /api/v1/user/signup
 */
export const createUserAccount = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 400);
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  });

  return generateToken(res, serializeUser(user), "Account created successfully");
});

/**
 * Authenticate user and get token
 * @route POST /api/v1/user/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  // Update last active
  await user.updateLastActive();

  return generateToken(res, serializeUser(user), "Logged in successfully");
});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/user/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
  return res
    .status(200)
    .cookie("token", "loggedout", {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

/**
 * Get current user profile
 * @route GET /api/v1/user/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).populate("enrolledCourses.course");
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const userDto = await serializeUserAsync(user);
  res.status(200).json({
    success: true,
    data: userDto
  });
});

/**
 * Update user profile
 * @route PATCH /api/v1/user/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, bio, email } = req.body;
  const updateData = {};

  if (name !== undefined) {
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }
    updateData.name = cleanName;
  }
  if (bio !== undefined) {
    if (bio.length > 500) {
      throw new AppError("Bio cannot exceed 500 characters", 400);
    }
    updateData.bio = bio.trim();
  }
  if (email !== undefined) {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/.test(cleanEmail)) {
      throw new AppError("Please provide a valid email", 400);
    }
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: req.user.id } });
    if (existingUser) {
      throw new AppError("A user with this email already exists", 400);
    }
    updateData.email = cleanEmail;
  }

  if (req.file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError("Profile picture must be a JPEG, PNG, or WEBP image", 400);
    }
    if (req.file.size > 2 * 1024 * 1024) {
      throw new AppError("Profile picture must be smaller than 2MB", 400);
    }
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const avatarKey = `courses/users/${req.user.id}/avatars/${Date.now()}-${req.file.originalname}`;
    const avatarUrl = await uploadLocalFileToS3(req.file.path, bucketName, avatarKey, req.file.mimetype);
    updateData.avatar = avatarUrl;
    updateData.avatarKey = avatarKey; // stored so we can re-sign on future profile fetches
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  );

  // Return signed avatar URL so the client can display the new photo immediately
  const userDto = await serializeUserAsync(updatedUser);
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: userDto
  });
});

/**
 * Change user password
 * @route PATCH /api/v1/user/change-password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Incorrect current password", 401);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully"
  });
});

/**
 * Request password reset
 * @route POST /api/v1/user/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  // Stubbed for simplicity in dev/demo
  res.status(200).json({
    success: true,
    message: "Reset email functionality is stubbed. Contact your administrator."
  });
});

/**
 * Reset password
 * @route POST /api/v1/user/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Reset password functionality is stubbed."
  });
});

/**
 * Delete user account
 * @route DELETE /api/v1/user/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(200).json({
    success: true,
    message: "Account deleted successfully"
  });
});
