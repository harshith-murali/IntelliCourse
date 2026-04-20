import { create } from 'zustand';
import { Course, Enrollment, CreateCourseInput } from '../types';
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

  // Enrollment actions
  getMyCourses: (userId: string) => Promise<void>;
  enrollInCourse: (userId: string, courseId: string) => Promise<void>;
  getEnrollments: (courseId: string) => Promise<void>;
  getEnrollmentsByUser: (userId: string) => Promise<Enrollment[]>;
  updateProgress: (enrollmentId: string, progress: number) => Promise<void>;

  // State setters
  setCurrentCourse: (course: Course | null) => void;
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
      const course = await apiService.getCourseById(courseId);
      if (course) {
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
    set({ isLoading: true });
    try {
      const enrollments = await apiService.getEnrollments(courseId);
      set({ enrollments, error: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
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

  updateProgress: async (enrollmentId: string, progress: number) => {
    try {
      const enrollment = await apiService.updateProgress(enrollmentId, progress);
      const { enrollments } = get();
      const updated = enrollments.map((e) => (e.id === enrollmentId ? enrollment : e));
      set({ enrollments: updated });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setCurrentCourse: (course: Course | null) => {
    set({ currentCourse: course });
  },

  clearError: () => {
    set({ error: null });
  },
}));
