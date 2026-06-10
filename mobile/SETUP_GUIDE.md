# LMS App - Complete Setup Guide

## Project Initialization ✅

The project has been created with:
- **Expo** with TypeScript template
- **React Native** for mobile UI
- **Expo Router** for navigation
- **Zustand** for state management
- **expo-av** for video playback

## Installation

```bash
cd /Users/muralic/Desktop/lms

# Install dependencies
npm install
```

## Folder Structure

```
lms/
├── app/
│   ├── _layout.tsx              # Root navigation (Auth > Tabs)
│   ├── auth/
│   │   ├── login.tsx            # Login screen with demo accounts
│   │   └── signup.tsx           # Signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation (student/instructor)
│   │   ├── home.tsx             # Dashboard & quick stats
│   │   ├── courses.tsx          # Browse & search courses (student)
│   │   ├── my-courses.tsx       # Enrolled courses (student)
│   │   ├── dashboard.tsx        # Teaching dashboard (instructor)
│   │   ├── manage.tsx           # Manage courses (instructor)
│   │   └── profile.tsx          # User profile & settings
│   ├── course-detail.tsx        # Course detail view & lessons
│   ├── video-player.tsx         # Video lesson player
│   └── create-course.tsx        # Create course form
│
├── components/
│   ├── CourseCard.tsx           # Course display card
│   ├── LessonItem.tsx           # Lesson list item
│   ├── StatsCard.tsx            # Stats widget
│   ├── Button.tsx               # Reusable button
│   ├── ProgressBar.tsx          # Progress indicator
│   ├── LoadingSpinner.tsx       # Loading state
│   └── index.ts                 # Component exports
│
├── store/
│   ├── authStore.ts             # Auth state (Zustand)
│   └── courseStore.ts           # Course state (Zustand)
│
├── services/
│   └── api.ts                   # Mock API service layer
│
├── hooks/
│   ├── useAuth.ts               # Auth hook
│   ├── useCourse.ts             # Course hook
│   └── index.ts                 # Hook exports
│
├── types/
│   └── index.ts                 # TypeScript interfaces
│
├── data/
│   └── mockData.ts              # Mock courses & users
│
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

## Running the App

### Development Server

```bash
# Start Expo development server
npx expo start

# Options:
# Press 'w' for Web (http://localhost:8081)
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app for real device
```

### Web Preview

```bash
npx expo start --web
# Opens at http://localhost:8081
```

## Demo Accounts

### Student Account
```
Email: john@example.com
Password: password
Role: Student
```

### Instructor Account
```
Email: sarah@example.com
Password: password
Role: Instructor
```

## File-by-File Breakdown

### Authentication Flows

**app/_layout.tsx**
- Conditional rendering: if not authenticated → auth screens
- If authenticated → tab navigation
- Handles auth state check

**app/auth/login.tsx**
- Email & password inputs
- Demo account quick-login buttons
- Links to signup

**app/auth/signup.tsx**
- Name, email, and role selection
- Student vs Instructor toggle
- Links to login

### Navigation

**app/(tabs)/_layout.tsx**
- Tab navigator for authenticated users
- Student tabs: Home, Courses, My Courses, Profile
- Instructor tabs: Home, Dashboard, Manage, Profile
- Dynamic routing based on user role

### Student Screens

**app/(tabs)/home.tsx**
- Welcome message with user avatar
- Progress stats (enrolled courses, completed, streak)
- Recommended courses carousel

**app/(tabs)/courses.tsx**
- Search & filter courses
- Course cards with ratings, price
- Tap to view details
- Enroll in courses

**app/(tabs)/my-courses.tsx**
- Show enrolled courses
- Progress bars for each course
- Empty state with CTA

**app/(tabs)/profile.tsx**
- User info & avatar
- Settings menu
- Account options
- Logout button

### Instructor Screens

**app/(tabs)/dashboard.tsx**
- Teaching stats (active courses, students, revenue)
- List of created courses
- Quick course access

**app/(tabs)/manage.tsx**
- All instructor courses
- Edit & delete actions
- Create new course button
- Empty state

**app/(tabs)/home.tsx** (Instructor)
- Same as student but shows:
  - Created courses count
  - Total students count
  - Revenue stats

### Shared Screens

**app/course-detail.tsx**
- Course info (title, instructor, rating, price)
- Course description
- Lessons list
- Enroll/Progress display
- Instructor bio

**app/video-player.tsx**
- Video player (expo-av)
- Lesson info & description
- Duration display
- Mark as complete button
- Navigation back to course

**app/create-course.tsx**
- Title, description inputs
- Category selection
- Level selection (beginner/intermediate/advanced)
- Price input
- Create & cancel buttons

### Components

**CourseCard.tsx**
- Course thumbnail
- Title, instructor, category, level
- Rating & student count
- Price display

**LessonItem.tsx**
- Lesson icon (play or checkmark)
- Title & description
- Duration
- Completed indicator

**StatsCard.tsx**
- Icon with background color
- Label & value
- Used for dashboards

**Button.tsx**
- Variants: primary, secondary, danger
- Sizes: small, medium, large
- Loading state
- Disabled state

**ProgressBar.tsx**
- Visual progress bar
- Percentage label
- Used in courses

**LoadingSpinner.tsx**
- ActivityIndicator
- Centered layout

### State Management

**store/authStore.ts**
- user: Current user info
- token: Auth token
- isLoading: Loading state
- isAuthenticated: Auth status
- login, signup, logout, setUser functions

**store/courseStore.ts**
- courses: All courses
- myCourses: User's enrolled courses
- currentCourse: Selected course
- enrollments: User enrollments
- isLoading, error states
- CRUD functions for courses & lessons

### Services

**services/api.ts**
- Mock API with ~800ms delays
- Returns Promises (simulates real API)
- Functions:
  - loginUser, signupUser
  - getCourses, getCourseById
  - createCourse, updateCourse, deleteCourse
  - enrollInCourse, getMyCourses
  - addLesson, updateLesson, deleteLesson
  - updateProgress, getEnrollments

### Types

**types/index.ts**
- User, UserRole
- Course, Lesson, Enrollment
- CreateCourseInput, CreateLessonInput
- AuthState interface

### Data

**data/mockData.ts**
- mockUsers: john (student), sarah (instructor), mike (instructor)
- mockCourses: 4 sample courses with lessons
- mockEnrollments: Sample enrollments

## How It Works

### Authentication Flow
1. User opens app → checks authStore.isAuthenticated
2. If false → shows login/signup screens
3. User clicks login → calls authStore.login()
4. API returns user & token → stored in Zustand
5. Navigation switches to (tabs)
6. user.role determines which tabs are shown

### Course Flow
1. Student browses courses → getCourses()
2. Taps course → navigates to course-detail
3. getCourseById() loads full details
4. Student enrolls → enrollInCourse()
5. Added to myCourses
6. Can now watch lessons

### Lesson Flow
1. Course shows lessons list
2. Tap lesson → navigate to video-player
3. Video plays from lesson.videoUrl
4. Mark complete → updateProgress()

### Instructor Flow
1. Instructor sees dashboard
2. Creates course → createCourse()
3. Course added to instructorCourses
4. Can edit or delete
5. Can add lessons to course

## Type Safety

All code is **fully typed with TypeScript**:
- Component props are interfaces
- API responses are typed
- Zustand stores are typed
- No `any` types (except necessary expo types)

## Key Hooks

```typescript
// useAuth hook - gets auth state & actions
const { user, token, isAuthenticated, login, logout } = useAuth();

// useCourse hook - gets course state & actions
const { courses, myCourses, currentCourse, createCourse } = useCourse();
```

## Styling

All screens use:
- React Native built-in components
- Flexbox layout
- Custom StyleSheets
- Consistent color scheme:
  - Primary: #3b82f6 (blue)
  - Success: #10b981 (green)
  - Danger: #ef4444 (red)
  - Neutral: #6b7280 (gray)

## Error Handling

- Try-catch in async functions
- Alert dialogs for user feedback
- Loading states during operations
- Empty states for no data

## Ready for Backend Integration

To connect to real API:
1. Replace URLs in `services/api.ts`
2. Add authentication headers
3. Update error handling
4. Keep Zustand store interface same
5. Minimal changes needed!

## Next Steps

1. ✅ Run `npm install`
2. ✅ Run `npx expo start`
3. ✅ Test with demo accounts
4. ✅ Explore features
5. ✅ Check code structure
6. 🔄 Connect to backend when ready

## Troubleshooting

**App won't start:**
```bash
npx expo start --clear
```

**TypeScript errors:**
```bash
npx tsc --noEmit
```

**Import errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Slow bundler:**
- Close other apps
- Rebuild: `npx expo start --clear`

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Happy Coding! 🚀**
