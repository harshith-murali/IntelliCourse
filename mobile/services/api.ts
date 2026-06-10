import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  User,
  Course,
  Enrollment,
  CreateCourseInput,
  CreateLessonInput,
  LessonSummary,
  LessonAskResponse,
  LessonQuiz,
  CourseRecommendation,
} from '../types';

// ─── API Configuration ──────────────────────────────────────────────────────
// Auto-detect the host machine's IP address dynamically using Expo Constants.
// Fallback to loopbacks (10.0.2.2 for Android emulator, localhost for iOS simulator/Web).
const getBackendIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return ip;
  }
  
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return '127.0.0.1'; // Use loopback for local iOS simulator / Web
};

const BACKEND_IP = getBackendIp();
const API_BASE_URL = `http://${BACKEND_IP}:8001/api/v1`;

console.log(`[API Config] Connecting to backend at: ${API_BASE_URL}`);

// Configure Axios Client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie support
});

// Memory token cache
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Add interceptor to inject cached token
apiClient.interceptors.request.use(
  (config) => {
    if (authToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to extract backend error messages globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  mapUser(user: any): User {
    const avatar = user?.avatarUrl || user?.avatar;
    return {
      id: user?._id || user?.id || '',
      email: user?.email || '',
      name: user?.name || 'Learner',
      role: user?.role || 'student',
      avatar,
      bio: user?.bio || '',
    };
  },

  // Auth
  async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/user/signin', { email, password });
    const { user, token } = response.data;
    
    // Save token in memory
    setAuthToken(token);
    
    // Map backend response fields to frontend models
    return {
      user: this.mapUser(user),
      token,
    };
  },

  async signupUser(
    email: string,
    name: string,
    role: 'student' | 'instructor',
    password: string
  ): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/user/signup', {
      name,
      email,
      password,
      role,
    });
    
    const { user, token } = response.data;
    setAuthToken(token);

    return {
      user: this.mapUser(user),
      token,
    };
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get('/course/published');
    const courses = response.data.data;
    return courses.map(this.mapCourse);
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    // _t param prevents axios from serving a stale 304 cached response
    const response = await apiClient.get(`/course/c/${courseId}`, {
      params: { _t: Date.now() },
    });
    return this.mapCourse(response.data.data);
  },

  async getInstructorCourses(instructorId: string): Promise<Course[]> {
    const response = await apiClient.get('/course/');
    const courses = response.data.data;
    return courses.map(this.mapCourse);
  },

  async createCourse(data: CreateCourseInput): Promise<Course> {
    const response = await apiClient.post('/course/', data);
    return this.mapCourse(response.data.data);
  },

  async updateCourse(courseId: string, data: Partial<CreateCourseInput>): Promise<Course> {
    const response = await apiClient.patch(`/course/c/${courseId}`, data);
    return this.mapCourse(response.data.data);
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiClient.delete(`/course/c/${courseId}`);
  },

  // Lessons
  async addLesson(courseId: string, data: CreateLessonInput): Promise<any> {
    const response = await apiClient.post(`/course/c/${courseId}/lectures`, data);
    return response.data.data;
  },

  async updateLesson(courseId: string, lessonId: string, data: Partial<CreateLessonInput>): Promise<any> {
    // Stubbed update, maps to custom endpoints or course edit
    return { id: lessonId, ...data };
  },

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await apiClient.delete(`/course/c/${courseId}/lectures/${lessonId}`);
  },

  // S3 Video Ingestion Flow
  async getPresignedUploadUrl(
    courseId: string,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<{ mediaAssetId: string; uploadUrl: string; rawUrl: string }> {
    const response = await apiClient.post('/media/presigned-upload', {
      courseId,
      fileName,
      fileType,
      fileSize,
    });
    return response.data.data;
  },

  async getPresignedThumbnailUrl(
    courseId: string,
    fileName: string,
    fileType: string
  ): Promise<{ uploadUrl: string; s3Key: string; rawUrl: string }> {
    const response = await apiClient.post('/media/presigned-thumbnail', {
      courseId,
      fileName,
      fileType,
    });
    return response.data.data;
  },

  async uploadFileToS3(
    uploadUrl: string,
    fileUri: string,
    fileType: string,
    onProgress?: (pct: number) => void
  ): Promise<boolean> {
    console.log("=== S3 CLIENT UPLOAD START ===");
    console.log(`- File URI: ${fileUri}`);
    console.log(`- Expected MIME Type: ${fileType}`);
    console.log(`- S3 Upload URL: ${uploadUrl}`);
    console.log(`- Request Method: PUT`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      
      // Explicitly set matching Content-Type header
      xhr.setRequestHeader('Content-Type', fileType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress(percentage);
          }
        };
      }

      xhr.onload = () => {
        console.log(`=== S3 CLIENT UPLOAD RESPONSE ===`);
        console.log(`- Status Code: ${xhr.status}`);
        console.log(`- Response Headers:`, xhr.getAllResponseHeaders());
        console.log(`- Response Text:`, xhr.responseText);

        if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
          resolve(true);
        } else {
          const errMessage = `S3 upload failed: ${xhr.status} - ${xhr.responseText}`;
          console.error(errMessage);
          reject(new Error(errMessage));
        }
      };

      xhr.onerror = (err) => {
        console.error("=== S3 CLIENT UPLOAD NETWORK ERROR ===");
        console.error("- Network Error object details:", err);
        console.error("- Current XHR status:", xhr.status);
        console.error("- Current XHR responseText:", xhr.responseText);
        reject(new Error(`S3 upload network error. Status: ${xhr.status}, Response: ${xhr.responseText || 'None'}`));
      };

      fetch(fileUri)
        .then((res) => {
          console.log(`- Local file fetch status: ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          console.log(`- Original Blob: size=${blob.size}, type=${blob.type}`);
          xhr.send(blob);
        })
        .catch((err) => {
          console.error("- Local Blob extraction failed:", err);
          reject(err);
        });
    });
  },

  async confirmS3Upload(mediaAssetId: string, lectureId: string, duration: number): Promise<any> {
    const response = await apiClient.post('/media/confirm-upload', {
      mediaAssetId,
      lectureId,
      duration,
    });
    return response.data.data;
  },

  async getLecturePlaybackUrl(courseId: string, lectureId: string): Promise<string> {
    const response = await apiClient.get(`/media/play/c/${courseId}/l/${lectureId}`);
    return response.data.data.playbackUrl;
  },

  // Enrollments & Payments
  async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    // For free courses, Razorpay createOrder handles quick enrollment
    const response = await apiClient.post('/razorpay/create-order', { courseId });
    if (response.data.isFree) {
      return {
        id: `enroll_${Date.now()}`,
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        completed: false,
      };
    }
    throw new Error('Course requires payment validation');
  },

  async createRazorpayOrder(courseId: string): Promise<any> {
    const response = await apiClient.post('/razorpay/create-order', { courseId });
    return response.data;
  },

  async verifyRazorpayPayment(
    courseId: string,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const response = await apiClient.post('/razorpay/verify-payment', {
      courseId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
    return response.data.success;
  },

  async getMyCourses(userId: string): Promise<Course[]> {
    const response = await apiClient.get('/purchase/');
    const courses = response.data.data;
    return courses.map(this.mapCourse);
  },

  async getEnrollments(courseId: string): Promise<Enrollment[]> {
    // Stubbed mock values
    return [];
  },

  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    // Fallback/stub
    return {
      id: enrollmentId,
      userId: '',
      courseId: '',
      enrolledAt: '',
      progress,
      completed: progress === 100,
    };
  },

  async updateBackendProgress(courseId: string, lectureId: string, watchTime: number, isCompleted: boolean): Promise<any> {
    const response = await apiClient.patch(`/progress/${courseId}/lectures/${lectureId}`, {
      watchTime,
      isCompleted,
    });
    return response.data.data;
  },

  async getCourseProgress(courseId: string): Promise<any> {
    const response = await apiClient.get(`/progress/${courseId}`);
    return response.data.data;
  },

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    const response = await apiClient.get('/purchase/');
    const courses = response.data.data;
    return courses.map((c: any) => ({
      id: `enroll_${c._id}`,
      userId,
      courseId: c._id,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completed: false,
    }));
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const response = await apiClient.get('/user/profile');
    const user = response.data.data;
    return this.mapUser(user);
  },

  async updateUserProfile(
    name: string,
    bio: string,
    email: string,
    avatarUri?: string
  ): Promise<User> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('email', email);

    if (avatarUri) {
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('avatar', {
        uri: avatarUri,
        name: filename,
        type,
      } as any);
    }

    const response = await apiClient.patch('/user/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const user = response.data.data;
    return this.mapUser(user);
  },

  // AI features
  async getLessonSummary(courseId: string, lessonId: string): Promise<LessonSummary> {
    const response = await apiClient.post('/ai/summary', { courseId, lessonId });
    return response.data.data;
  },

  async askLessonAI(courseId: string, lessonId: string, question: string): Promise<LessonAskResponse> {
    const response = await apiClient.post('/ai/ask', { courseId, lessonId, question });
    return response.data.data;
  },

  async generateLessonQuiz(courseId: string, lessonId: string, count = 5): Promise<LessonQuiz> {
    const response = await apiClient.post('/ai/quiz', { courseId, lessonId, count });
    return response.data.data;
  },

  async getCourseRecommendations(limit = 6): Promise<CourseRecommendation[]> {
    const response = await apiClient.get('/ai/recommendations', { params: { limit } });
    return (response.data.data.recommendations || []).map(this.mapCourseRecommendation);
  },


  // Helper mapper to convert Mongo schema details to client models
  mapCourse(c: any): Course {
    if (!c) return {} as Course;
    const coverImageUrl = c.coverImageUrl || c.thumbnailUrl || c.thumbnail || '';
    const thumbnail = coverImageUrl || c.coverImage || c.image;
    const enrolledCount = Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : c.students || c.enrolledCount || 0;
    return {
      id: c._id || c.id,
      title: c.title,
      subtitle: c.subtitle || '',
      description: c.description || '',
      category: c.category || 'General',
      level: c.level || 'beginner',
      price: c.price || 0,
      thumbnail,
      thumbnailUrl: coverImageUrl || thumbnail,
      coverImageUrl: coverImageUrl || thumbnail,
      thumbnailKey: c.thumbnailKey,
      rating: c.rating || 0,
      students: enrolledCount,
      createdAt: c.createdAt || new Date().toISOString(),
      instructor: {
        id: c.instructor?._id || c.instructor?.id || '',
        email: c.instructor?.email || '',
        name: c.instructor?.name || 'Instructor',
        avatar: c.instructor?.avatarUrl || c.instructor?.avatar,
        role: 'instructor',
      },
      lessons: (c.lectures || []).map((l: any, idx: number) => ({
        id: l._id || l.id,
        title: l.title,
        description: l.description || '',
        sectionId: l.sectionId || '',
        sectionTitle: l.sectionTitle || 'General',
        videoUrl: l.videoUrl || '',
        duration: l.duration || 0,
        durationSeconds: l.durationSeconds || l.duration || 0,
        thumbnailUrl: l.thumbnailUrl,
        thumbnailKey: l.thumbnailKey,
        tags: l.tags || [],
        difficulty: l.difficulty || 'beginner',
        transcript: l.transcript || '',
        notes: l.notes || '',
        isPreview: !!l.isPreview,
        objectives: l.objectives || [],
        resources: l.resources || [],
        order: l.order || (idx + 1),
        completed: false,
      })),
    };
  },

  mapCourseRecommendation(c: any): CourseRecommendation {
    const coverImageUrl = c.coverImageUrl || c.thumbnailUrl || c.thumbnail || c.coverImage || c.image || '';
    return {
      courseId: c.courseId || c._id || c.id,
      title: c.title || 'Untitled Course',
      subtitle: c.subtitle || '',
      thumbnail: coverImageUrl,
      thumbnailUrl: coverImageUrl,
      coverImageUrl,
      thumbnailKey: c.thumbnailKey,
      category: c.category || 'General',
      level: c.level,
      price: c.price,
      students: c.students,
      reason: c.reason || 'Recommended for your learning path',
      score: Number(c.score) || 0,
    };
  },
};
