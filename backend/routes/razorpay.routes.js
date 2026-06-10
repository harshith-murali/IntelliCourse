import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/razorpay.controller.js";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

// Only students can purchase courses
router.post("/create-order", isAuthenticated, restrictTo("student"), createRazorpayOrder);
router.post("/verify-payment", isAuthenticated, restrictTo("student"), verifyPayment);

export default router;
