import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse } from '../../hooks';
import { CourseCard, LoadingSpinner, StatsCard } from '../../components';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { courses, isLoading, getInstructorCourses, getEnrollments } = useCourse();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (user?.id) {
      await getInstructorCourses(user.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const totalStudents = 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Teaching Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <StatsCard
          icon="book"
          label="Active Courses"
          value={courses.length}
          color="#3b82f6"
        />
        <StatsCard
          icon="people"
          label="Total Students"
          value={totalStudents}
          color="#10b981"
        />
        <StatsCard
          icon="star"
          label="Average Rating"
          value="4.8"
          color="#f59e0b"
        />
      </View>

      {/* Your Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Courses</Text>
        {courses.length > 0 ? (
          courses.map((course) => (
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
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No courses created yet</Text>
            <Text style={styles.emptySubtext}>Create your first course to get started</Text>
          </View>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 28,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
