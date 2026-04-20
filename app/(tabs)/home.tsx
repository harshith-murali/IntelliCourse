import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse, useTheme } from '../../hooks';
import { CourseCard, LoadingSpinner, StatsCard, HeroSection } from '../../components';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { courses, myCourses, isLoading, getCourses, getMyCourses } = useCourse();
  const { colors, isDark, toggleTheme } = useTheme();

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Welcome back, {user?.name}!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isStudent
              ? `You have ${myCourses.length} active courses`
              : `You're teaching ${courses.length} courses`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: colors.surface }]}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
          </TouchableOpacity>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
        </View>
      </View>

      {/* Hero Section */}
      <HeroSection
        title={isStudent ? "Keep Learning!" : "Grow Your Teaching"}
        subtitle={isStudent ? "Continue your journey to success" : "Inspire students worldwide"}
        icon={isStudent ? 'book' : 'school'}
      />

      {/* Stats for Students */}
      {isStudent && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Courses</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Teaching Dashboard</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
  },
});
