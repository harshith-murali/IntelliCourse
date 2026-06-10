import { create } from 'zustand';
import { Course, Enrollment, CreateCourseInput, CreateLessonInput, User } from '../types';
import { apiService } from '../services/api';

interface CourseStore {
  courses: Course[];
  myCourses: Course[];
  currentCourse: Course | null;
  enrollments: Enrollment[];
  isLoading: boolean;
  error: string | null;

  // Course actions
  getCourses: () => Promise<void>;
  getCourseById: (courseId: string) => Promise<void>;
  getInstructorCourses: (instructorId: string) => Promise<Course[]>;
  createCourse: (data: CreateCourseInput) => Promise<void>;
  updateCourse: (courseId: string, data: Partial<CreateCourseInput>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;

  // S3 upload + Lesson actions
  addLessonToCourse: (courseId: string, data: CreateLessonInput) => Promise<any>;
  uploadLessonVideo: (
    courseId: string,
    lectureId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    duration: number,
    onProgress?: (pct: number) => void
  ) => Promise<void>;
  getLectureUrl: (courseId: string, lectureId: string) => Promise<string>;
  deleteLesson: (courseId: string, lessonId: string) => Promise<void>;

  // Enrollment & Payment actions
  getMyCourses: (userId: string) => Promise<void>;
  enrollInCourse: (userId: string, courseId: string) => Promise<void>;
  getEnrollments: (courseId: string) => Promise<Enrollment[]>;
  getEnrollmentsByUser: (userId: string) => Promise<Enrollment[]>;
  checkoutWithRazorpay: (courseId: string) => Promise<any>;
  verifyPayment: (courseId: string, orderId: string, paymentId: string, signature: string) => Promise<boolean>;

  // Progress actions
  getCourseProgress: (courseId: string) => Promise<any>;
  updateProgress: (enrollmentId: string, progress: number) => Promise<Enrollment>;
  updateLectureProgress: (courseId: string, lectureId: string, watchTime: number, isCompleted: boolean) => Promise<void>;

  // State setters
  setCurrentCourse: (course: Course | null) => void;
  /** Update instructor sub-object in all cached course lists after a profile update */
  syncInstructorProfile: (instructorId: string, updatedUser: User) => void;
  clearError: () => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  myCourses: [],
  currentCourse: null,
  enrollments: [],
  isLoading: false,
  error: null,

  getCourses: async () => {
    set({ isLoading: true });
    try {
      const courses = await apiService.getCourses();
      set({ courses, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getCourseById: async (courseId: string) => {
    set({ isLoading: true });
    try {
      // Pre-seed currentCourse from the already-fetched (signed) courses list
      // so the thumbnail shows immediately before the network call resolves
      const existing = get().courses.find((c) => c.id === courseId);
      if (existing) {
        set({ currentCourse: existing });
      }

      const course = await apiService.getCourseById(courseId);
      if (course) {
        // Preserve the signed thumbnailUrl from the pre-seeded course if the
        // fresh response doesn't have one (e.g. backend returned unsigned URL)
        if (!course.thumbnailUrl && existing?.thumbnailUrl) {
          course.thumbnailUrl = existing.thumbnailUrl;
          course.thumbnail = existing.thumbnailUrl;
        }
        set({ currentCourse: course, error: null });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getInstructorCourses: async (instructorId: string) => {
    set({ isLoading: true });
    try {
      const courses = await apiService.getInstructorCourses(instructorId);
      set({ courses, error: null, isLoading: false });
      return courses;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    }
  },

  createCourse: async (data: CreateCourseInput) => {
    set({ isLoading: true });
    try {
      const course = await apiService.createCourse(data);
      const { courses } = get();
      set({ courses: [...courses, course], error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCourse: async (courseId: string, data: Partial<CreateCourseInput>) => {
    set({ isLoading: true });
    try {
      const course = await apiService.updateCourse(courseId, data);
      const { courses, currentCourse } = get();
      const updated = courses.map((c) => (c.id === courseId ? course : c));
      const updatedCurrent = currentCourse?.id === courseId ? course : currentCourse;
      set({ courses: updated, currentCourse: updatedCurrent, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCourse: async (courseId: string) => {
    set({ isLoading: true });
    try {
      await apiService.deleteCourse(courseId);
      const { courses } = get();
      const filtered = courses.filter((c) => c.id !== courseId);
      set({ courses: filtered, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Lesson & S3 Upload action bindings
  addLessonToCourse: async (courseId: string, data: CreateLessonInput) => {
    set({ isLoading: true });
    try {
      const lesson = await apiService.addLesson(courseId, data);
      set({ isLoading: false, error: null });
      return lesson;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  uploadLessonVideo: async (
    courseId: string,
    lectureId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    duration: number,
    onProgress?: (pct: number) => void
  ) => {
    set({ isLoading: true });
    try {
      // 1. Get presigned URL
      const { mediaAssetId, uploadUrl } = await apiService.getPresignedUploadUrl(
        courseId,
        fileName,
        fileType,
        fileSize
      );

      // 2. Upload file directly to AWS S3 bucket
      await apiService.uploadFileToS3(uploadUrl, fileUri, fileType, onProgress);

      // 3. Confirm upload metadata with backend
      await apiService.confirmS3Upload(mediaAssetId, lectureId, duration);

      set({ isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getLectureUrl: async (courseId: string, lectureId: string) => {
    try {
      return await apiService.getLecturePlaybackUrl(courseId, lectureId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteLesson: async (courseId: string, lessonId: string) => {
    set({ isLoading: true });
    try {
      await apiService.deleteLesson(courseId, lessonId);
      const { currentCourse } = get();
      if (currentCourse && currentCourse.id === courseId) {
        const filteredLessons = currentCourse.lessons.filter((l) => l.id !== lessonId);
        set({
          currentCourse: { ...currentCourse, lessons: filteredLessons },
          error: null,
          isLoading: false
        });
      } else {
        set({ isLoading: false, error: null });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Enrollment & payment actions
  getMyCourses: async (userId: string) => {
    set({ isLoading: true });
    try {
      const myCourses = await apiService.getMyCourses(userId);
      set({ myCourses, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  enrollInCourse: async (userId: string, courseId: string) => {
    set({ isLoading: true });
    try {
      await apiService.enrollInCourse(userId, courseId);
      const myCourses = await apiService.getMyCourses(userId);
      set({ myCourses, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getEnrollments: async (courseId: string) => {
    try {
      return await apiService.getEnrollments(courseId);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  getEnrollmentsByUser: async (userId: string) => {
    try {
      return await apiService.getEnrollmentsByUser(userId);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  checkoutWithRazorpay: async (courseId: string) => {
    try {
      return await apiService.createRazorpayOrder(courseId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  verifyPayment: async (courseId: string, orderId: string, paymentId: string, signature: string) => {
    try {
      const success = await apiService.verifyRazorpayPayment(courseId, orderId, paymentId, signature);
      if (success) {
        // Refresh enrolled courses list
        const { myCourses } = get();
        const course = await apiService.getCourseById(courseId);
        if (course) {
          set({ myCourses: [...myCourses, course] });
        }
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Progress actions
  getCourseProgress: async (courseId: string) => {
    try {
      return await apiService.getCourseProgress(courseId);
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateProgress: async (enrollmentId: string, progress: number) => {
    try {
      return await apiService.updateProgress(enrollmentId, progress);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateLectureProgress: async (courseId: string, lectureId: string, watchTime: number, isCompleted: boolean) => {
    try {
      await apiService.updateBackendProgress(courseId, lectureId, watchTime, isCompleted);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setCurrentCourse: (course: Course | null) => {
    set({ currentCourse: course });
  },

  syncInstructorProfile: (instructorId: string, updatedUser: User) => {
    const { courses, myCourses, currentCourse } = get();

    const patchInstructor = (course: Course): Course => {
      if (course?.instructor?.id !== instructorId) return course;
      return { ...course, instructor: { ...course.instructor, ...updatedUser } };
    };

    set({
      courses: courses.map(patchInstructor),
      myCourses: myCourses.map(patchInstructor),
      currentCourse: currentCourse ? patchInstructor(currentCourse) : currentCourse,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
