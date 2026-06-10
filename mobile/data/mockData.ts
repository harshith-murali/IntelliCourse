import { User, Course, Enrollment } from '../types';

export const mockUsers: { [key: string]: User } = {
  student1: {
    id: 'student1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    bio: 'Passionate learner exploring React Native',
  },
  instructor1: {
    id: 'instructor1',
    email: 'sarah@example.com',
    name: 'Sarah Anderson',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Mobile app developer with 10+ years experience',
  },
  instructor2: {
    id: 'instructor2',
    email: 'mike@example.com',
    name: 'Mike Johnson',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    bio: 'Full-stack developer and tech educator',
  },
};

export const mockCourses: Course[] = [
  {
    id: 'course1',
    title: 'React Native Masterclass',
    description:
      'Learn to build cross-platform mobile apps with React Native and Expo. Cover everything from basics to advanced patterns.',
    instructor: mockUsers.instructor1,
    thumbnail:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    price: 79.99,
    rating: 4.8,
    students: 1250,
    level: 'intermediate',
    category: 'Mobile Development',
    createdAt: new Date(2024, 0, 15).toISOString(),
    lessons: [
      {
        id: 'lesson1-1',
        title: 'Introduction to React Native',
        description: 'Get started with React Native fundamentals',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 1200,
        order: 1,
        completed: true,
      },
      {
        id: 'lesson1-2',
        title: 'Components & Navigation',
        description: 'Master React Native components and navigation patterns',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 1800,
        order: 2,
        completed: true,
      },
      {
        id: 'lesson1-3',
        title: 'State Management with Zustand',
        description: 'Learn state management best practices',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 1500,
        order: 3,
        completed: false,
      },
      {
        id: 'lesson1-4',
        title: 'Building with Expo',
        description: 'Deploy apps using Expo',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 2000,
        order: 4,
        completed: false,
      },
    ],
  },
  {
    id: 'course2',
    title: 'TypeScript for Full-Stack Development',
    description:
      'Master TypeScript to build scalable and maintainable applications. Perfect for both frontend and backend developers.',
    instructor: mockUsers.instructor2,
    thumbnail:
      'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=500&h=300&fit=crop',
    price: 69.99,
    rating: 4.7,
    students: 890,
    level: 'intermediate',
    category: 'Programming',
    createdAt: new Date(2024, 1, 10).toISOString(),
    lessons: [
      {
        id: 'lesson2-1',
        title: 'TypeScript Basics',
        description: 'Introduction to TypeScript',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 900,
        order: 1,
        completed: false,
      },
      {
        id: 'lesson2-2',
        title: 'Advanced Types',
        description: 'Deep dive into TypeScript type system',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 1600,
        order: 2,
        completed: false,
      },
    ],
  },
  {
    id: 'course3',
    title: 'Web Design Fundamentals',
    description:
      'Learn modern web design principles, UI/UX best practices, and create beautiful websites from scratch.',
    instructor: mockUsers.instructor1,
    thumbnail:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop',
    price: 59.99,
    rating: 4.9,
    students: 2100,
    level: 'beginner',
    category: 'Design',
    createdAt: new Date(2024, 2, 5).toISOString(),
    lessons: [
      {
        id: 'lesson3-1',
        title: 'Design Principles',
        description: 'Core design fundamentals',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNgyOOilO1P1pIFsmVWUJW5E0',
        duration: 1100,
        order: 1,
        completed: false,
      },
    ],
  },
  {
    id: 'course4',
    title: 'Advanced React Patterns',
    description: 'Master advanced React patterns, hooks, and optimization techniques for production applications.',
    instructor: mockUsers.instructor2,
    thumbnail:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop',
    price: 89.99,
    rating: 4.6,
    students: 650,
    level: 'advanced',
    category: 'Web Development',
    createdAt: new Date(2024, 3, 12).toISOString(),
    lessons: [],
  },
];

export const mockEnrollments: Enrollment[] = [
  {
    id: 'enroll1',
    userId: 'student1',
    courseId: 'course1',
    enrolledAt: new Date(2024, 1, 20).toISOString(),
    progress: 50,
    completed: false,
  },
  {
    id: 'enroll2',
    userId: 'student1',
    courseId: 'course3',
    enrolledAt: new Date(2024, 2, 10).toISOString(),
    progress: 25,
    completed: false,
  },
];
