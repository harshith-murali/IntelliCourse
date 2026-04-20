import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse } from '../../hooks';
import { CourseCard, LoadingSpinner, ProgressBar } from '../../components';
import { router } from 'expo-router';

export default function MyCoursesScreen() {
  const { user } = useAuth();
  const { myCourses, isLoading, getMyCourses } = useCourse();

  useEffect(() => {
    if (user?.id) {
      getMyCourses(user.id);
    }
  }, [user?.id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {myCourses.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Your Learning Path</Text>
          {myCourses.map((course) => (
            <View key={course.id}>
              <CourseCard
                course={course}
                onPress={() => {
                  router.push({
                    pathname: '/course-detail',
                    params: { courseId: course.id },
                  });
                }}
                showEnrolled
              />
              <View style={styles.progressContainer}>
                <ProgressBar progress={50} showLabel={true} />
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No courses enrolled yet</Text>
          <Text style={styles.emptySubtext}>
            Explore our course library to get started
          </Text>
          <View style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Browse Courses</Text>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
