# LMS App - Complete Project Structure

## Overview
Production-quality Udemy-style LMS app with RBAC, mock API, and full TypeScript support.

## Directory Tree

```
lms/
│
├── app/                              # Expo Router screens (main app structure)
│   │
│   ├── _layout.tsx                   # ROOT LAYOUT
│   │                                 # Conditional rendering based on auth
│   │                                 # Auth screens → Tab navigation
│   │
│   ├── auth/                         # Authentication routes
│   │   ├── login.tsx                 # Login with demo accounts
│   │   └── signup.tsx                # Signup with role selection
│   │
│   ├── (tabs)/                       # Tab-based navigation (authenticated)
│   │   ├── _layout.tsx               # TAB NAVIGATOR
│   │   │                             # Dynamic tabs based on user.role
│   │   ├── home.tsx                  # Dashboard (student & instructor)
│   │   ├── courses.tsx               # Browse courses (student only)
│   │   ├── my-courses.tsx            # Enrolled courses (student only)
│   │   ├── dashboard.tsx             # Teaching stats (instructor only)
│   │   ├── manage.tsx                # Manage courses (instructor only)
│   │   └── profile.tsx               # User profile & settings
│   │
│   ├── course-detail.tsx             # Course detail view & lessons
│   ├── video-player.tsx              # Video lesson player
│   └── create-course.tsx             # Create/edit course form
│
├── components/                       # Reusable UI components
│   ├── CourseCard.tsx                # Course display (thumbnail, title, rating, price)
│   ├── LessonItem.tsx                # Lesson list item (with progress indicator)
│   ├── StatsCard.tsx                 # Statistics widget
│   ├── Button.tsx                    # Reusable button (primary, secondary, danger)
│   ├── ProgressBar.tsx               # Progress visualization
│   ├── LoadingSpinner.tsx            # Loading indicator
│   └── index.ts                      # Component exports
│
├── store/                            # Zustand state management
│   ├── authStore.ts                  # User authentication state
│   │                                 # user, token, isAuthenticated
│   │                                 # login, signup, logout
│   │
│   └── courseStore.ts                # Course & enrollment state
│                                     # courses, myCourses, currentCourse
│                                     # enrollments, isLoading, error
│                                     # CRUD operations
│
├── services/                         # Business logic & API
│   └── api.ts                        # Mock API service layer
│                                     # Returns Promises (~800ms delays)
│                                     # Ready for backend integration
│
├── hooks/                            # Custom React hooks
│   ├── useAuth.ts                    # Auth hook (user, token, login, etc)
│   ├── useCourse.ts                  # Course hook (all course actions)
│   └── index.ts                      # Hook exports
│
├── types/                            # TypeScript interfaces
│   └── index.ts                      # User, Course, Lesson, Enrollment, etc
│
├── data/                             # Mock data (for development)
│   └── mockData.ts                   # mockUsers, mockCourses, mockEnrollments
│
├── constants/                        # App constants
│   └── theme.ts                      # Color scheme & theming
│
├── README.md                         # Quick start guide
├── SETUP_GUIDE.md                    # Detailed setup & file breakdown
├── PROJECT_STRUCTURE.md              # This file
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── app.json                          # Expo app configuration
└── .expo/                            # Expo configuration (auto-generated)
```

## Core Files

### Authentication & Navigation
| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root navigator - auth vs authenticated |
| `app/auth/login.tsx` | Login screen with demo accounts |
| `app/auth/signup.tsx` | Signup with role selection |

### Student Screens
| File | Purpose |
|------|---------|
| `app/(tabs)/home.tsx` | Dashboard with stats |
| `app/(tabs)/courses.tsx` | Browse & search courses |
| `app/(tabs)/my-courses.tsx` | Enrolled courses |
| `app/(tabs)/profile.tsx` | User profile |

### Instructor Screens
| File | Purpose |
|------|---------|
| `app/(tabs)/dashboard.tsx` | Teaching analytics |
| `app/(tabs)/manage.tsx` | Course management |

### Shared Screens
| File | Purpose |
|------|---------|
| `app/course-detail.tsx` | Course info & lessons |
| `app/video-player.tsx` | Video playback |
| `app/create-course.tsx` | Course creation form |

### State Management
| File | Purpose |
|------|---------|
| `store/authStore.ts` | Auth state (Zustand) |
| `store/courseStore.ts` | Course state (Zustand) |

### Services & Data
| File | Purpose |
|------|---------|
| `services/api.ts` | Mock API (async functions) |
| `data/mockData.ts` | Sample data for development |

### Utilities
| File | Purpose |
|------|---------|
| `hooks/useAuth.ts` | Auth custom hook |
| `hooks/useCourse.ts` | Course custom hook |
| `types/index.ts` | TypeScript interfaces |

## Key Features by File

### app/_layout.tsx (Entry Point)
```
├─ Check isAuthenticated
├─ If false → Show auth screens
│  ├─ /auth/login
│  └─ /auth/signup
└─ If true → Show (tabs)
   ├─ Based on user.role
   └─ Different tabs for student vs instructor
```

### app/(tabs)/_layout.tsx (Tab Navigation)
```
├─ Student tabs:
│  ├─ Home (dashboard)
│  ├─ Courses (browse)
│  ├─ My Courses (enrolled)
│  └─ Profile
│
└─ Instructor tabs:
   ├─ Home (dashboard)
   ├─ Dashboard (stats)
   ├─ Manage (courses)
   └─ Profile
```

### store/authStore.ts (Auth State)
```
├─ State:
│  ├─ user: User | null
│  ├─ token: string | null
│  ├─ isLoading: boolean
│  └─ isAuthenticated: boolean
│
└─ Actions:
   ├─ login(email, password)
   ├─ signup(email, name, role)
   ├─ logout()
   └─ setUser(user)
```

### store/courseStore.ts (Course State)
```
├─ State:
│  ├─ courses: Course[]
│  ├─ myCourses: Course[]
│  ├─ currentCourse: Course | null
│  ├─ enrollments: Enrollment[]
│  ├─ isLoading: boolean
│  └─ error: string | null
│
├─ Course Actions:
│  ├─ getCourses()
│  ├─ getCourseById(id)
│  ├─ createCourse(data)
│  ├─ updateCourse(id, data)
│  └─ deleteCourse(id)
│
└─ Enrollment Actions:
   ├─ enrollInCourse(userId, courseId)
   ├─ getMyCourses(userId)
   ├─ getEnrollments(courseId)
   └─ updateProgress(enrollmentId, progress)
```

### services/api.ts (Mock API)
```
├─ Auth:
│  ├─ loginUser(email, password)
│  └─ signupUser(email, name, role)
│
├─ Courses:
│  ├─ getCourses()
│  ├─ getCourseById(id)
│  ├─ getInstructorCourses(id)
│  ├─ createCourse(data)
│  ├─ updateCourse(id, data)
│  └─ deleteCourse(id)
│
├─ Lessons:
│  ├─ addLesson(courseId, data)
│  ├─ updateLesson(courseId, lessonId, data)
│  └─ deleteLesson(courseId, lessonId)
│
└─ Enrollments:
   ├─ enrollInCourse(userId, courseId)
   ├─ getMyCourses(userId)
   ├─ getEnrollments(courseId)
   └─ updateProgress(enrollmentId, progress)
```

### components/ (UI Library)
```
├─ CourseCard
│  └─ Displays: thumbnail, title, instructor, rating, price
│
├─ LessonItem
│  └─ Displays: icon, title, duration, completed status
│
├─ StatsCard
│  └─ Displays: icon, label, value with color
│
├─ Button
│  ├─ Variants: primary, secondary, danger
│  ├─ Sizes: small, medium, large
│  └─ States: normal, loading, disabled
│
├─ ProgressBar
│  └─ Displays: progress bar with percentage
│
└─ LoadingSpinner
   └─ Displays: centered activity indicator
```

## Data Types (types/index.ts)

```typescript
├─ User
│  ├─ id: string
│  ├─ email: string
│  ├─ name: string
│  ├─ role: 'student' | 'instructor'
│  ├─ avatar?: string
│  └─ bio?: string
│
├─ Course
│  ├─ id: string
│  ├─ title: string
│  ├─ description: string
│  ├─ instructor: User
│  ├─ thumbnail: string
│  ├─ price: number
│  ├─ rating: number
│  ├─ students: number
│  ├─ lessons: Lesson[]
│  ├─ category: string
│  ├─ level: 'beginner' | 'intermediate' | 'advanced'
│  └─ createdAt: string
│
├─ Lesson
│  ├─ id: string
│  ├─ title: string
│  ├─ description: string
│  ├─ videoUrl: string
│  ├─ duration: number
│  ├─ order: number
│  └─ completed: boolean
│
└─ Enrollment
   ├─ id: string
   ├─ userId: string
   ├─ courseId: string
   ├─ enrolledAt: string
   ├─ progress: number
   └─ completed: boolean
```

## Workflow Examples

### Student Login & Browse
```
Login Screen
    ↓ (login('john@example.com', 'password'))
authStore.login() → api.loginUser()
    ↓ (returns user & token)
authStore.isAuthenticated = true
    ↓
Navigation → (tabs) [Home, Courses, My Courses, Profile]
    ↓
Courses Screen → useCourse.getCourses()
    ↓
Display CourseCard components
    ↓
User taps course → course-detail.tsx
    ↓
Load course details → useCourse.getCourseById()
    ↓
Show lessons
    ↓
User enrolls → useCourse.enrollInCourse()
    ↓
Move to My Courses
    ↓
Select lesson → video-player.tsx
    ↓
Play video → Mark complete
```

### Instructor Create Course
```
Login as Instructor
    ↓
Dashboard Tab → Manage Tab
    ↓
Click "Create New" → create-course.tsx
    ↓
Fill form (title, description, category, level, price)
    ↓
Submit → useCourse.createCourse()
    ↓
Course added to mockCourses
    ↓
Redirect to Manage tab
    ↓
View newly created course
    ↓
Can edit or delete
```

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| expo | Framework | latest |
| react-native | UI framework | latest |
| expo-router | Navigation | latest |
| zustand | State management | ^4.x |
| axios | HTTP client | ^1.x |
| expo-av | Video player | ^15.0.8 |
| @expo/vector-icons | Icons | latest |
| typescript | Type checking | ^5.x |

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript settings |
| `app.json` | Expo app manifest |
| `package.json` | Dependencies & scripts |

## Styling

All styling uses React Native StyleSheet:
- Flexbox layout
- Custom color palette
- Consistent spacing
- Responsive design

Color Scheme:
- Primary: #3b82f6 (Blue)
- Success: #10b981 (Green)
- Danger: #ef4444 (Red)
- Neutral: #6b7280 (Gray)
- Background: #f9fafb (Light Gray)

---

**Total Files: 18 app screens + 6 components + 2 stores + 1 API service**
