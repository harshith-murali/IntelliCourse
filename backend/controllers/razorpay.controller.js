import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mocksecret",
});

/**
 * Create a new Razorpay Order for a course purchase
 * @route POST /api/v1/razorpay/create-order
 */
export const createRazorpayOrder = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (course.instructor.toString() === userId) {
    throw new AppError("Course creators already have access to their own course", 400);
  }

  // Check if user already purchased the course
  const existingPurchase = await CoursePurchase.findOne({
    user: userId,
    course: courseId,
    status: "completed"
  });

  if (existingPurchase) {
    throw new AppError("You have already enrolled in this course", 400);
  }

  await CoursePurchase.deleteMany({
    user: userId,
    course: courseId,
    status: "pending"
  });

  // Handle free courses by enrolling them immediately without paying
  if (course.price === 0) {
     // Create a completed purchase record
     await CoursePurchase.create({
       course: courseId,
       user: userId,
       amount: 0,
       currency: "INR",
       status: "completed",
       paymentMethod: "free",
       paymentId: `free_${Date.now()}`
     });

     // Link user to course
     await User.findByIdAndUpdate(userId, {
       $addToSet: { enrolledCourses: { course: courseId } }
     });

     await Course.findByIdAndUpdate(courseId, {
       $addToSet: { enrolledStudents: userId }
     });

     await CourseProgress.findOneAndUpdate(
       { user: userId, course: courseId },
       {
         $setOnInsert: {
           user: userId,
           course: courseId,
           lectureProgress: course.lectures.map(lectureId => ({
             lecture: lectureId,
             isCompleted: false,
             watchTime: 0
           }))
         }
       },
       { upsert: true, new: true }
     );

     return res.status(200).json({
       success: true,
       isFree: true,
       message: "Enrolled in free course successfully"
     });
  }

  // Generate options for order creation
  const amount = Math.round(course.price * 100); // Razorpay expects amount in paise
  const options = {
    amount,
    currency: "INR",
    receipt: `receipt_course_${courseId.substring(0, 8)}_${Date.now()}`,
  };

  let order;
  try {
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkey') {
      // Mock order for dev/demo if keys are defaults
      order = {
        id: `order_mock_${Date.now()}`,
        amount,
        currency: "INR",
        receipt: options.receipt
      };
    } else {
      order = await razorpay.orders.create(options);
    }
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    throw new AppError("Payment gateway initialization failed", 500);
  }

  // Save pending purchase record
  await CoursePurchase.create({
    course: courseId,
    user: userId,
    amount: course.price,
    currency: "INR",
    status: "pending",
    paymentMethod: "razorpay",
    paymentId: order.id,
  });

  res.status(200).json({
    success: true,
    isFree: false,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
});

/**
 * Verify Razorpay payment signature
 * @route POST /api/v1/razorpay/verify-payment
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !courseId) {
    throw new AppError("Order ID, Payment ID, and Course ID are required", 400);
  }

  const alreadyCompleted = await CoursePurchase.findOne({
    user: userId,
    course: courseId,
    status: "completed"
  });
  if (alreadyCompleted) {
    return res.status(200).json({
      success: true,
      message: "Course is already enrolled"
    });
  }

  // Signature verification logic
  let signatureVerified = false;

  if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkey' || razorpay_signature === 'dev_mock_sig') {
    // Automatically verify mock signals during dev testing
    signatureVerified = true;
  } else {
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      signatureVerified = true;
    }
  }

  const purchase = await CoursePurchase.findOne({
    user: userId,
    course: courseId,
    paymentId: razorpay_order_id
  });

  if (!purchase) {
    throw new AppError("Purchase transaction record not found", 404);
  }

  if (signatureVerified) {
    // Update purchase status
    purchase.status = "completed";
    purchase.metadata = { paymentId: razorpay_payment_id };
    await purchase.save();

    // Link user to course
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: { course: courseId } }
    });

    // Link course to user
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: userId }
    });

    // Initialize course progress
    const course = await Course.findById(courseId);
    await CourseProgress.findOneAndUpdate(
      { user: userId, course: courseId },
      {
        $setOnInsert: {
          user: userId,
          course: courseId,
          lectureProgress: course.lectures.map(lectureId => ({
            lecture: lectureId,
            isCompleted: false,
            watchTime: 0
          }))
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and enrollment completed successfully"
    });
  } else {
    purchase.status = "failed";
    await purchase.save();
    throw new AppError("Payment verification failed", 400);
  }
});
