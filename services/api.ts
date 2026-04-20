import { mockUsers, mockCourses, mockEnrollments } from '../data/mockData';
import {
  User,
  Course,
  Enrollment,
  CreateCourseInput,
  CreateLessonInput,
} from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // Auth
  async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(1000);

    const user = Object.values(mockUsers).find((u) => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      user,
      token: `mock_token_${user.id}_${Date.now()}`,
    };
  },

  async signupUser(
    email: string,
    name: string,
    role: 'student' | 'instructor'
  ): Promise<{ user: User; token: string }> {
    await delay(1000);

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bio: '',
    };

    return {
      user: newUser,
      token: `mock_token_${newUser.id}_${Date.now()}`,
    };
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    await delay(800);
    return mockCourses;
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    await delay(600);
    return mockCourses.find((c) => c.id === courseId) || null;
  },

  async getInstructorCourses(instructorId: string): Promise<Course[]> {
    await delay(700);
    return mockCourses.filter((c) => c.instructor.id === instructorId);
  },

  async createCourse(data: CreateCourseInput): Promise<Course> {
    await delay(1200);

    const newCourse: Course = {
      id: `course_${Date.now()}`,
      ...data,
      instructor: mockUsers.instructor1,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
      rating: 0,
      students: 0,
      lessons: [],
      createdAt: new Date().toISOString(),
    };

    mockCourses.push(newCourse);
    return newCourse;
  },

  async updateCourse(courseId: string, data: Partial<CreateCourseInput>): Promise<Course> {
    await delay(900);

    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    Object.assign(course, data);
    return course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await delay(800);

    const index = mockCourses.findIndex((c) => c.id === courseId);
    if (index > -1) {
      mockCourses.splice(index, 1);
    }
  },

  // Lessons
  async addLesson(courseId: string, data: CreateLessonInput): Promise<any> {
    await delay(900);

    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const newLesson = {
      id: `lesson_${Date.now()}`,
      ...data,
      order: course.lessons.length + 1,
      completed: false,
    };

    course.lessons.push(newLesson);
    return newLesson;
  },

  async updateLesson(courseId: string, lessonId: string, data: Partial<CreateLessonInput>): Promise<any> {
    await delay(700);

    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    Object.assign(lesson, data);
    return lesson;
  },

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await delay(600);

    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const index = course.lessons.findIndex((l) => l.id === lessonId);
    if (index > -1) {
      course.lessons.splice(index, 1);
    }
  },

  // Enrollments
  async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    await delay(900);

    const existing = mockEnrollments.find(
      (e) => e.userId === userId && e.courseId === courseId
    );
    if (existing) {
      throw new Error('Already enrolled');
    }

    const newEnrollment: Enrollment = {
      id: `enroll_${Date.now()}`,
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completed: false,
    };

    mockEnrollments.push(newEnrollment);
    return newEnrollment;
  },

  async getMyCourses(userId: string): Promise<Course[]> {
    await delay(800);

    const enrollmentIds = mockEnrollments
      .filter((e) => e.userId === userId)
      .map((e) => e.courseId);

    return mockCourses.filter((c) => enrollmentIds.includes(c.id));
  },

  async getEnrollments(courseId: string): Promise<Enrollment[]> {
    await delay(700);

    return mockEnrollments.filter((e) => e.courseId === courseId);
  },

  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    await delay(400);

    const enrollment = mockEnrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    enrollment.progress = Math.min(100, Math.max(0, progress));
    if (enrollment.progress === 100) {
      enrollment.completed = true;
    }

    return enrollment;
  },

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    await delay(600);

    return mockEnrollments.filter((e) => e.userId === userId);
  },

  async getUserProfile(userId: string): Promise<User | null> {
    await delay(500);

    return Object.values(mockUsers).find((u) => u.id === userId) || null;
  },
};
