import "./utils/polyfill.js";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import razorpayRoute from "./routes/razorpay.routes.js";
import healthRoute from "./routes/health.routes.js";
import aiRoute from "./routes/ai.route.js";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// Load environment variables
dotenv.config();

// Fail fast on missing/mock S3/AWS environment variables
const requiredEnvVars = [
  "AWS_S3_BUCKET_NAME",
  "AWS_REGION"
];

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === "" || value.toLowerCase().includes("mock") || value.toLowerCase().includes("your_access_key") || value.toLowerCase().includes("placeholder")) {
    console.error(`\n[FATAL ERROR] Startup validation failed: Environment variable ${envVar} is missing, empty, or set to a mock placeholder value ("${value}"). Please update backend/.env with real credentials.\n`);
    process.exit(1);
  }
}

// Verify AWS credentials using STS GetCallerIdentity
try {
  const stsClient = new STSClient({ region: process.env.AWS_REGION || "us-east-1" });
  const data = await stsClient.send(new GetCallerIdentityCommand({}));
  console.log(`\n==================================================`);
  console.log(`✅ AWS credentials verified successfully via STS!`);
  console.log(`- IAM Principal ARN: ${data.Arn}`);
  console.log(`- AWS Account ID: ${data.Account}`);
  console.log(`- AWS User ID: ${data.UserId}`);
  console.log(`==================================================\n`);
} catch (error) {
  console.error(`\n[FATAL ERROR] AWS credentials validation failed via STS GetCallerIdentity:`, error.message);
  console.error(`Please verify that you have valid AWS credentials configured in your environment or ~/.aws/credentials.\n`);
  process.exit(1);
}

// Connect to database
await connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Security Middleware 
app.use(helmet()); // Set security HTTP headers
// Custom MongoDB Sanitizer for Express v5 compatibility
app.use((req, res, next) => {
  const sanitizeObj = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitizeObj(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitizeObj(req.body);
  if (req.params) sanitizeObj(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      } else if (req.query[key] instanceof Object) {
        sanitizeObj(req.query[key]);
      }
    }
  }
  next();
});

// Custom XSS Sanitizer for Express v5 compatibility
app.use((req, res, next) => {
  const cleanXss = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  const sanitizeXss = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = cleanXss(obj[key]);
        } else if (obj[key] instanceof Object) {
          sanitizeXss(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitizeXss(req.body);
  if (req.params) sanitizeXss(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = cleanXss(req.query[key]);
      } else if (req.query[key] instanceof Object) {
        sanitizeXss(req.query[key]);
      }
    }
  }
  next();
});

app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use("/api", limiter); // Apply rate limiting to all routes

// Logging Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body Parser Middleware
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  })
);

// API Routes
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/razorpay", razorpayRoute);
app.use("/api/v1/ai", aiRoute);
app.use("/api/ai", aiRoute);
app.use("/health", healthRoute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global Error Handler.
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    ` Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});
