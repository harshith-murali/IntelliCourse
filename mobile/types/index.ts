export type UserRole = 'student' | 'instructor' | 'admin';

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
  profileVersion: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  sectionId?: string;
  sectionTitle?: string;
  videoUrl: string;
  duration: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  transcript?: string;
  notes?: string;
  isPreview?: boolean;
  objectives?: string[];
  resources?: { title?: string; url: string }[];
  order: number;
  completed: boolean;
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  instructor: User;
  thumbnail: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  thumbnailKey?: string;
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
  subtitle?: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

export interface CreateLessonInput {
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  sectionId?: string;
  sectionTitle?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  transcript?: string;
  notes?: string;
  isPreview?: boolean;
  objectives?: string[];
  resources?: { title?: string; url: string }[];
  order?: number;
}

export interface LessonSummary {
  summary: string;
  keyPoints: string[];
  estimatedReadTime: string;
}

export interface LessonAskResponse {
  answer: string;
  followUpQuestions: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonQuiz {
  questions: QuizQuestion[];
}

export interface CourseRecommendation {
  courseId: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  thumbnailKey?: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  students?: number;
  reason: string;
  score: number;
}
