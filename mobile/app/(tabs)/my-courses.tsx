import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse, useTheme } from '../../hooks';
import { CourseCard, ProgressBar, SectionHeader, StatsCard } from '../../components';
import { SkeletonCard } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { router } from 'expo-router';

export default function MyCoursesScreen() {
  const { user } = useAuth();
  const { myCourses, isLoading, getMyCourses } = useCourse();
  const { colors, spacing, radii, shadow } = useTheme();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const averageProgress = myCourses.length
    ? Math.round(myCourses.reduce((sum, course) => sum + (progressMap[course.id] || 0), 0) / myCourses.length)
    : 0;

  const loadData = async () => {
    if (user?.id) {
      setLoadingProgress(true);
      await getMyCourses(user.id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    const fetchAllProgress = async () => {
      if (myCourses.length > 0) {
        const newProgressMap: Record<string, number> = {};
        for (const course of myCourses) {
          try {
            const progressData = await apiService.getCourseProgress(course.id);
            newProgressMap[course.id] = progressData?.completionPercentage || 0;
          } catch (e) {
            newProgressMap[course.id] = 0;
          }
        }
        setProgressMap(newProgressMap);
      }
      setLoadingProgress(false);
    };

    if (myCourses.length > 0) {
      fetchAllProgress();
    } else {
      setLoadingProgress(false);
    }
  }, [myCourses]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {isLoading || loadingProgress ? (
        <>
          <SectionHeader title="My Courses" subtitle="Loading your active learning paths" />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : myCourses.length > 0 ? (
        <>
          <SectionHeader title="My Courses" subtitle="Resume lessons and keep your streak moving" />
          <View style={styles.statsGrid}>
            <View style={styles.statsCol}>
              <StatsCard icon="play-circle-outline" label="In progress" value={myCourses.length} />
            </View>
            <View style={styles.statsCol}>
              <StatsCard icon="trending-up-outline" label="Average" value={`${averageProgress}%`} color={colors.info} />
            </View>
          </View>
          {myCourses.map((course) => (
            <View key={course.id} style={styles.courseWrapper}>
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
              <View 
                style={[
                  styles.progressContainer, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border,
                    borderBottomLeftRadius: radii.md,
                    borderBottomRightRadius: radii.md,
                    borderWidth: 1,
                    borderTopWidth: 0,
                    padding: spacing.md,
                    marginTop: -16,
                    marginBottom: spacing.md,
                    ...shadow
                  }
                ]}
              >
                <ProgressBar progress={progressMap[course.id] || 0} showLabel={true} />
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={[styles.emptyState, { paddingVertical: spacing.xxl * 2 }]}>
          <Ionicons name="journal-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text, marginTop: spacing.md }]}>No courses enrolled yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            Explore our course library to start learning!
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary, borderRadius: radii.full, paddingVertical: spacing.md, paddingHorizontal: spacing.xl }]}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.emptyButtonText}>Browse Catalog</Text>
          </TouchableOpacity>
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
  courseWrapper: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statsCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressContainer: {
    borderBottomWidth: 1,
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
  emptyButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
