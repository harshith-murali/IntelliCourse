# LMS Mobile App - React Native + Expo

A production-quality Udemy-style Learning Management System (LMS) mobile app built with **React Native**, **Expo**, and **TypeScript**.

## Features

### Student Features
- 📚 Browse and search courses
- 🎓 Enroll in courses
- ▶️ Watch video lessons with expo-av
- 📊 Track learning progress
- 📱 View enrolled courses
- 👤 Manage profile

### Instructor Features
- 📝 Create and manage courses
- 📹 Add lessons with video content
- 📊 View teaching dashboard
- 👥 Manage enrollments
- 🗑️ Delete courses

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Scan QR code with Expo Go app, or press 'w' for web
```

## Demo Accounts

**Student**: john@example.com / password
**Instructor**: sarah@example.com / password

## Architecture

```
app/                    # Expo Router screens
├── (tabs)/            # Tab-based navigation
├── auth/              # Authentication
├── course-detail.tsx  # Course detail
├── video-player.tsx   # Video player
└── create-course.tsx  # Course creation

components/           # Reusable UI components
store/               # Zustand state management
services/            # Mock API layer
hooks/               # Custom hooks
types/               # TypeScript types
data/                # Mock data
```

## Tech Stack

- React Native + Expo
- TypeScript
- Expo Router (navigation)
- Zustand (state management)
- expo-av (video player)
- Axios (HTTP client)

## Features Explained

### RBAC (Role-Based Access Control)
- **Student**: Browse courses, enroll, watch lessons, track progress
- **Instructor**: Create courses, manage lessons, view analytics

### Mock API Service
All API calls are async functions with simulated delays (~800ms):
- loginUser, signupUser
- getCourses, getCourseById, createCourse, updateCourse
- enrollInCourse, getMyCourses
- addLesson, updateLesson, deleteLesson

### State Management
- **authStore**: User authentication
- **courseStore**: Courses and enrollments

## Project Structure

### Components
- CourseCard: Course display with rating and price
- LessonItem: Lesson list item
- StatsCard: Statistics display
- Button: Reusable button component
- ProgressBar: Progress visualization
- LoadingSpinner: Loading state

### Services
- api.ts: Mock API service layer (ready for backend integration)

### Stores
- authStore.ts: User auth state
- courseStore.ts: Course data state

## Running the App

```bash
# Web
npx expo start --web

# iOS
npx expo start --ios

# Android
npx expo start --android

# Expo Go (scan QR)
npx expo start
```

## Navigation Flow

### Student
Login → Home → Courses → Enroll → Watch → Profile

### Instructor
Login → Home → Dashboard → Create/Manage → Profile

## Backend Integration

Replace mock API calls in `services/api.ts`:

```typescript
// Before
async getCourses(): Promise<Course[]> {
  await delay(800);
  return mockCourses;
}

// After
async getCourses(): Promise<Course[]> {
  const response = await axios.get('https://api.example.com/courses');
  return response.data;
}
```

## Key Files

- `app/_layout.tsx` - Root navigation
- `app/(tabs)/_layout.tsx` - Tab navigation
- `store/authStore.ts` - Auth state
- `store/courseStore.ts` - Course state
- `services/api.ts` - API service
- `data/mockData.ts` - Mock data
- `types/index.ts` - TypeScript types

## Troubleshooting

```bash
# Clear cache
npx expo start --clear

# Type check
npx tsc --noEmit

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## Production Checklist

- [ ] Replace mock API with real backend
- [ ] Add environment variables
- [ ] Implement real authentication
- [ ] Add error logging
- [ ] Test on real devices
- [ ] Optimize bundle size
- [ ] Add analytics
- [ ] Implement offline support

---

**Built with React Native & Expo** ⚛️
