import { useCourseStore } from '../store/courseStore';

export const useCourse = () => {
  const {
    courses,
    myCourses,
    currentCourse,
    enrollments,
    isLoading,
    error,
    getCourses,
    getCourseById,
    getInstructorCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getMyCourses,
    enrollInCourse,
    getEnrollments,
    getEnrollmentsByUser,
    updateProgress,
    setCurrentCourse,
    clearError,
  } = useCourseStore();

  return {
    courses,
    myCourses,
    currentCourse,
    enrollments,
    isLoading,
    error,
    getCourses,
    getCourseById,
    getInstructorCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getMyCourses,
    enrollInCourse,
    getEnrollments,
    getEnrollmentsByUser,
    updateProgress,
    setCurrentCourse,
    clearError,
  };
};
