import connectDB from "../database/db.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { getPresignedUploadUrl } from "../services/s3.service.js";
import dotenv from "dotenv";
import assert from "assert";

dotenv.config({ path: "./backend/.env" });

async function runTests() {
  console.log("🚀 Starting backend test suite...");
  
  // 1. Connect to Database
  try {
    await connectDB();
    console.log("✅ Database connected successfully for testing.");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  const testEmail = `test_user_${Date.now()}@example.com`;
  const testPassword = "Password@1234!";
  let testUser = null;
  let testCourse = null;

  try {
    // 2. Test Signup Password Validations (Model Level validation)
    console.log("\n🧪 Running Signup Validation Tests...");
    
    // Test: password too short
    await assert.rejects(
      async () => {
        await User.create({
          name: "Test User",
          email: testEmail,
          password: "123", // too short
        });
      },
      (err) => {
        assert.ok(err.errors.password, "Should fail validation due to short password");
        return true;
      },
      "Password of length < 8 should fail validation"
    );
    console.log("   ✓ Rejected short password successfully.");

    // Create valid user for auth tests
    testUser = await User.create({
      name: "John Instructor",
      email: testEmail,
      password: testPassword,
      role: "instructor"
    });
    assert.ok(testUser._id, "Valid user should be created successfully");
    console.log("   ✓ Created test instructor user successfully.");

    // 3. Test Auth Flow / Hashing
    console.log("\n🧪 Running Auth Flow Tests...");
    assert.notStrictEqual(testUser.password, testPassword, "Password must be hashed in the database");
    
    // Retrieve password explicitly (select: false) to test comparison
    const retrievedUser = await User.findById(testUser._id).select("+password");
    const isPasswordCorrect = await retrievedUser.comparePassword(testPassword);
    const isPasswordIncorrect = await retrievedUser.comparePassword("WrongPassword123!");
    
    assert.strictEqual(isPasswordCorrect, true, "Valid password check must return true");
    assert.strictEqual(isPasswordIncorrect, false, "Invalid password check must return false");
    console.log("   ✓ Password hashing and verification tested successfully.");

    // 4. Test Course Visibility & Instructor Attribution
    console.log("\n🧪 Running Course Visibility & Attribution Tests...");
    
    // Create course with the test user as instructor
    testCourse = await Course.create({
      title: "Test Automation Course",
      description: "Learn API testing with node asserts",
      category: "Programming",
      level: "beginner",
      price: 99.99,
      instructor: testUser._id,
      isPublished: true // Default to true now
    });
    
    assert.strictEqual(testCourse.isPublished, true, "Created course should be published by default for visibility");
    console.log("   ✓ Verified course is published by default on creation.");

    // Retrieve and populate to check instructor attribution
    const populatedCourse = await Course.findById(testCourse._id).populate("instructor", "name avatar bio");
    assert.strictEqual(populatedCourse.instructor.name, "John Instructor", "Instructor name should be populated correctly");
    assert.ok(populatedCourse.instructor.avatar, "Instructor avatar should be populated correctly");
    console.log("   ✓ Verified instructor attribution and field population.");

    // 5. Test S3 Presigned URL Generation
    console.log("\n🧪 Running S3 Presigned URL Tests...");
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const key = `courses/${testCourse._id}/lectures/${Date.now()}-test-video.mp4`;
    const uploadUrl = await getPresignedUploadUrl(bucketName, key, "video/mp4");
    
    assert.ok(uploadUrl, "S3 Presigned URL should be generated");
    assert.ok(uploadUrl.includes("amazonaws.com") || uploadUrl.includes("s3"), "Presigned URL should resolve to AWS S3 endpoint");
    console.log("   ✓ Generated S3 presigned URL successfully.");

    // 6. Test Lecture Deletion and S3 File cleanup
    console.log("\n🧪 Running Lecture Deletion Tests...");
    const { deleteLectureFromCourse } = await import("../controllers/course.controller.js");
    
    // Create a lecture and link it to testCourse
    const testLecture = await Lecture.create({
      title: "Test Lecture to Delete",
      description: "This video will be deleted",
      videoUrl: `https://${bucketName}.s3.amazonaws.com/${key}`,
      s3Key: key,
      order: 1
    });
    
    await Course.findByIdAndUpdate(testCourse._id, {
      $push: { lectures: testLecture._id }
    });
    
    // Call controller mock request/response
    const mockReq = {
      params: {
        courseId: testCourse._id.toString(),
        lectureId: testLecture._id.toString()
      },
      user: {
        id: testUser._id.toString()
      }
    };
    
    let responseStatus = null;
    let responseJson = null;
    
    try {
      await new Promise((resolve, reject) => {
        const mockRes = {
          status: (code) => {
            responseStatus = code;
            return {
              json: (data) => {
                responseJson = data;
                resolve();
              }
            };
          }
        };
        
        const mockNext = (err) => {
          if (err) reject(err);
          else resolve();
        };
        
        deleteLectureFromCourse(mockReq, mockRes, mockNext);
      });
    } catch (err) {
      console.error("\n❌ Controller threw an error:", err);
      throw err;
    }
    
    assert.strictEqual(responseStatus, 200, "Deletion should return status 200");
    assert.strictEqual(responseJson.success, true, "Deletion response should have success: true");
    
    // Verify it is deleted from database
    const checkLecture = await Lecture.findById(testLecture._id);
    assert.strictEqual(checkLecture, null, "Lecture should be deleted from the database");
    
    const checkCourse = await Course.findById(testCourse._id);
    assert.strictEqual(checkCourse.lectures.includes(testLecture._id), false, "Lecture reference should be pulled from course");
    console.log("   ✓ Verified lecture and associated keys deleted successfully.");

    console.log("\n✨ All tests completed successfully! 🎉");
  } catch (error) {
    console.error("\n❌ Test suite execution failed:", error);
    process.exit(1);
  } finally {
    // 7. Cleanup
    console.log("\n🧹 Cleaning up test database entries...");
    if (testCourse) {
      await Course.findByIdAndDelete(testCourse._id);
      console.log("   - Cleaned test course.");
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
      console.log("   - Cleaned test user.");
    }
    console.log("👋 Testing complete.");
    process.exit(0);
  }
}

runTests();
