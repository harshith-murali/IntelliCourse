import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse } from '../../hooks';
import { CourseCard, LoadingSpinner, Button } from '../../components';
import { router } from 'expo-router';

export default function ManageScreen() {
  const { user } = useAuth();
  const { courses, isLoading, getInstructorCourses, deleteCourse } = useCourse();

  useEffect(() => {
    if (user?.id) {
      getInstructorCourses(user.id);
    }
  }, [user?.id]);

  const handleDelete = (courseId: string, title: string) => {
    Alert.alert('Delete Course', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await deleteCourse(courseId);
          if (user?.id) {
            await getInstructorCourses(user.id);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Courses</Text>
        <Button
          label="Create New"
          onPress={() => router.push('/create-course')}
          size="small"
        />
      </View>

      {courses.length > 0 ? (
        <View>
          {courses.map((course) => (
            <View key={course.id} style={styles.courseItem}>
              <CourseCard
                course={course}
                onPress={() => {
                  router.push({
                    pathname: '/course-detail',
                    params: { courseId: course.id },
                  });
                }}
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    router.push({
                      pathname: '/course-detail',
                      params: { courseId: course.id },
                    });
                  }}
                >
                  <Ionicons name="create" size={18} color="#3b82f6" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(course.id, course.title)}
                >
                  <Ionicons name="trash" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No courses yet</Text>
          <Text style={styles.emptySubtext}>Create your first course to share knowledge</Text>
          <Button
            label="Create Course"
            onPress={() => router.push('/create-course')}
            style={styles.emptyButton}
          />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  courseItem: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
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
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 0,
  },
});
