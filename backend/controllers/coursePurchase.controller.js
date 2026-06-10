import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { User } from "../models/user.model.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";
import { signCourseThumbnail, signCourseThumbnails } from "../utils/courseDto.js";

/**
 * Initiate Stripe checkout (Mock fallback/stub since Razorpay is primary)
 * @route POST /api/v1/purchase/checkout/create-checkout-session
 */
export const initiateStripeCheckout = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Stripe checkout stub. Please use Razorpay orders endpoint.",
    url: `${process.env.CLIENT_URL || "http://localhost:8081"}/(tabs)/home`
  });
});

/**
 * Handle Stripe webhook events (Stub)
 * @route POST /api/v1/purchase/webhook
 */
export const handleStripeWebhook = catchAsync(async (req, res) => {
  res.status(200).json({ received: true });
});

/**
 * Get course details with purchase status for a specific user
 * @route GET /api/v1/purchase/course/:courseId/detail-with-status
 */
export const getCoursePurchaseStatus = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const course = await Course.findById(courseId)
    .populate("instructor", "name avatar bio")
    .populate({
      path: "lectures",
      options: { sort: { order: 1 } }
    });
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Check enrollment
  const purchase = await CoursePurchase.findOne({
    user: userId,
    course: courseId,
    status: "completed"
  });

  const enrolled = !!purchase || course.instructor._id.toString() === userId;

  const signedCourse = await signCourseThumbnail(course);

  res.status(200).json({
    success: true,
    data: {
      course: signedCourse,
      enrolled,
      isOwner: course.instructor._id.toString() === userId,
      purchase: purchase || null
    }
  });
});

/**
 * Get all purchased courses for the current student
 * @route GET /api/v1/purchase/
 */
export const getPurchasedCourses = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const purchases = await CoursePurchase.find({
    user: userId,
    status: "completed"
  }).populate({
    path: "course",
    populate: { path: "instructor", select: "name avatar" }
  });

  const courses = purchases.map(p => p.course).filter(c => c !== null);
  const signedCourses = await signCourseThumbnails(courses);

  res.status(200).json({
    success: true,
    count: signedCourses.length,
    data: signedCourses
  });
});
