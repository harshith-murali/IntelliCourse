import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Image } from 'react-native';
import { useAuth, useCourse } from '../../hooks';
import { CourseCard, LoadingSpinner, StatsCard } from '../../components';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { courses, myCourses, isLoading, getCourses, getMyCourses } = useCourse();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await getCourses();
    if (user?.id) {
      await getMyCourses(user.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isStudent = user?.role === 'student';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
          <Text style={styles.subtitle}>
            {isStudent
              ? `You have ${myCourses.length} active courses`
              : `You're teaching ${courses.length} courses`}
          </Text>
        </View>
        <Image source={{ uri: user?.avatar }} style={styles.avatar} />
      </View>

      {/* Stats for Students */}
      {isStudent && (
        <>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <StatsCard
            icon="book"
            label="Courses Enrolled"
            value={myCourses.length}
            color="#3b82f6"
          />
          <StatsCard
            icon="award"
            label="Courses Completed"
            value="0"
            color="#10b981"
          />
          <StatsCard
            icon="time"
            label="Learning Streak"
            value="5 days"
            color="#f59e0b"
          />
        </>
      )}

      {/* Recommended Courses */}
      {isStudent && (
        <>
          <Text style={styles.sectionTitle}>Recommended Courses</Text>
          {courses.slice(0, 3).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => {
                router.push({
                  pathname: '/course-detail',
                  params: { courseId: course.id },
                });
              }}
            />
          ))}
        </>
      )}

      {/* Quick Stats for Instructors */}
      {!isStudent && (
        <>
          <Text style={styles.sectionTitle}>Teaching Dashboard</Text>
          <StatsCard
            icon="book"
            label="Active Courses"
            value={courses.length}
            color="#3b82f6"
          />
          <StatsCard icon="people" label="Total Students" value="890" color="#10b981" />
          <StatsCard
            icon="trending-up"
            label="Revenue This Month"
            value="$4,250"
            color="#f59e0b"
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 24,
    marginBottom: 16,
  },
});
