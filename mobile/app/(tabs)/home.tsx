import React, { useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth, useCourse, useTheme } from '../../hooks';
import { CourseCard, HeroSection, SectionHeader, StatsCard } from '../../components';
import { SkeletonCard } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { Course, CourseRecommendation } from '../../types';
import { FALLBACK_COURSE_COVER, getCourseCoverUri } from '../../utils/images';

function RecommendationCard({ item }: { item: CourseRecommendation }) {
  const { colors, radii, shadow } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const coverUri = useMemo(
    () =>
      imageFailed
        ? FALLBACK_COURSE_COVER
        : getCourseCoverUri({
            thumbnail: item.thumbnail,
            thumbnailUrl: item.thumbnailUrl,
            coverImageUrl: item.coverImageUrl,
          } as Partial<Course>),
    [imageFailed, item.coverImageUrl, item.thumbnail, item.thumbnailUrl]
  );

  return (
    <TouchableOpacity
      style={[styles.recommendationCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, ...shadow }]}
      onPress={() => router.push({ pathname: '/course-detail', params: { courseId: item.courseId } })}
      activeOpacity={0.9}
    >
      <Image
        key={coverUri}
        source={{ uri: coverUri }}
        style={[styles.recommendationImage, { backgroundColor: colors.surfaceHover, borderRadius: radii.lg }]}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
      <View style={styles.recommendationBody}>
        <Text style={[styles.recommendationTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
        <View style={styles.recommendationMetaRow}>
          <Text style={[styles.recommendationPill, { backgroundColor: colors.primaryLight, color: colors.primary }]} numberOfLines={1}>{item.category || 'General'}</Text>
          <Text style={[styles.recommendationPill, { backgroundColor: colors.accentSoft, color: colors.textSecondary }]}>{Math.round(item.score)}%</Text>
        </View>
        <Text style={[styles.recommendationReason, { color: colors.textSecondary }]} numberOfLines={2}>{item.reason}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user, profileVersion } = useAuth();
  const { courses, myCourses, isLoading, getCourses, getMyCourses, getInstructorCourses } = useCourse();
  const { colors, spacing, radii } = useTheme();
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  const isStudent = user?.role === 'student';
  const isCreatorRole = user?.role === 'instructor' || user?.role === 'admin';
  const completedCount = myCourses.filter((course) => course.lessons.length > 0 && course.lessons.every((lesson) => lesson.completed)).length;

  useEffect(() => {
    loadData();
  }, [user?.id, user?.role]);

  const loadData = async () => {
    if (isCreatorRole) {
      if (user.id) await getInstructorCourses(user.id);
      return;
    }

    await getCourses();
    if (user?.id) {
      await getMyCourses(user.id);
      loadRecommendations();
    }
  };

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    try {
      setRecommendations(await apiService.getCourseRecommendations(6));
    } catch (error) {
      setRecommendationsError((error as Error).message);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: 110 }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.greeting, { color: colors.text }]}>Hi, {user?.name?.split(' ')[0] || 'Learner'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isStudent ? 'Keep your learning streak alive today.' : 'Create, publish, and guide your learners.'}
          </Text>
        </View>
      </View>

      <HeroSection
        title={isStudent ? 'Expand Your Mind' : 'Empower Learners'}
        subtitle={isStudent ? 'Premium lessons, practical progress, and smart next steps.' : 'Build polished courses and track learner momentum.'}
        icon={isStudent ? 'compass-outline' : 'easel-outline'}
      />

      <View style={styles.statsGrid}>
        <View style={styles.statsCol}>
          <StatsCard icon={isStudent ? 'book-outline' : 'albums-outline'} label={isStudent ? 'Enrolled' : 'Active courses'} value={isStudent ? myCourses.length : courses.length} caption="+ focused" />
        </View>
        <View style={styles.statsCol}>
          <StatsCard icon={isStudent ? 'flame-outline' : 'people-outline'} label={isStudent ? 'Completed' : 'Learners'} value={isStudent ? completedCount : courses.reduce((acc, course) => acc + course.students, 0)} color={colors.info} caption="on track" />
        </View>
      </View>

      {isStudent ? (
        <View style={styles.section}>
          <SectionHeader title="Recommended For You" subtitle="Deterministic matches with AI explanation text" actionLabel={recommendationsError ? 'Retry' : undefined} onAction={loadRecommendations} />
          {recommendationsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : recommendationsError ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{recommendationsError}</Text>
            </View>
          ) : recommendations.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
              <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No new matches yet. Explore the catalog as more courses are published.</Text>
            </View>
          ) : (
            recommendations.map((item) => <RecommendationCard key={item.courseId} item={item} />)
          )}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={isStudent ? 'Explore Courses' : 'Your Courses'} subtitle={isStudent ? 'Fresh courses with polished covers' : 'Manage your published learning paths'} />
        {isLoading && courses.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : courses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
            <Ionicons name={isStudent ? 'school-outline' : 'create-outline'} size={42} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isStudent ? 'No courses available yet.' : "You haven't created any courses yet."}
            </Text>
          </View>
        ) : (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} onPress={() => router.push({ pathname: '/course-detail', params: { courseId: course.id } })} />
          ))
        )}
      </View>
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  iconButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatar: {
    borderRadius: 999,
    borderWidth: 3,
    height: 46,
    width: 46,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  statsCol: {
    flex: 1,
  },
  section: {
    marginTop: 4,
    marginBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  recommendationCard: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    padding: 12,
    overflow: 'hidden',
  },
  recommendationImage: {
    height: 96,
    minWidth: 96,
    width: 96,
  },
  recommendationBody: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  recommendationMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  recommendationPill: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '900',
    maxWidth: 170,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendationReason: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
