export type UserRole = 'student' | 'instructor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  completed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: User;
  thumbnail: string;
  price: number;
  rating: number;
  students: number;
  lessons: Lesson[];
  createdAt: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
}

export interface CreateLessonInput {
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
}
