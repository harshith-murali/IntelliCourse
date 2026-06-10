import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse, useTheme } from '../../hooks';
import { CourseCard, LoadingSpinner, Button } from '../../components';
import { router } from 'expo-router';

export default function ManageScreen() {
  const { user } = useAuth();
  const { courses, isLoading, getInstructorCourses, deleteCourse } = useCourse();
  const { colors, spacing, radii, shadow } = useTheme();

  const loadData = async () => {
    if (user?.id) {
      await getInstructorCourses(user.id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleDelete = (courseId: string, title: string) => {
    Alert.alert('Delete Course', `Are you sure you want to delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteCourse(courseId);
            loadData();
          } catch (e) {
            Alert.alert('Error', (e as Error).message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      <View style={[styles.topBar, { marginBottom: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Manage Courses</Text>
        <Button
          label="Create New"
          onPress={() => router.push('/create-course')}
          size="small"
        />
      </View>

      {courses.length > 0 ? (
        <View>
          {courses.map((course) => (
            <View key={course.id} style={[styles.courseItem, { backgroundColor: colors.surface, borderRadius: radii.md, borderColor: colors.border, borderWidth: 1, ...shadow, marginBottom: spacing.md }]}>
              <CourseCard
                course={course}
                onPress={() => {
                  router.push({
                    pathname: '/course-detail',
                    params: { courseId: course.id },
                  });
                }}
              />
              <View style={[styles.actions, { borderTopColor: colors.border, padding: spacing.sm }]}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    router.push({
                      pathname: '/course-detail',
                      params: { courseId: course.id },
                    });
                  }}
                >
                  <Ionicons name="settings-outline" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Manage & Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleDelete(course.id, course.title)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { paddingVertical: spacing.xxl * 2 }]}>
          <Ionicons name="easel-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text, marginTop: spacing.md }]}>No courses yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginBottom: spacing.lg }]}>Create your first course to share your skills!</Text>
          <Button
            label="Create Course"
            onPress={() => router.push('/create-course')}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  courseItem: {
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
