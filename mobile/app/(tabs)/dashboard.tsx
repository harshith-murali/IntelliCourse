import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuth, useCourse, useTheme } from '../../hooks';
import { CourseCard, StatsCard } from '../../components';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { courses, isLoading, getInstructorCourses } = useCourse();
  const { colors, spacing } = useTheme();

  const loadData = async () => {
    if (user?.id) {
      await getInstructorCourses(user.id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const totalStudents = courses.reduce((acc, course) => acc + (course.students || 0), 0);
  const totalRevenue = courses.reduce((acc, course) => acc + ((course.students || 0) * course.price), 0);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      <View style={[styles.topBar, { marginBottom: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Instructor Analytics</Text>
      </View>

      {/* Grid Stats */}
      <View style={[styles.statsSection, { gap: spacing.md }]}>
        <View style={styles.row}>
          <View style={styles.col}>
            <StatsCard
              icon="journal-outline"
              label="Active Courses"
              value={courses.length}
              color={colors.primary}
            />
          </View>
          <View style={styles.col}>
            <StatsCard
              icon="people-outline"
              label="Active Students"
              value={totalStudents}
              color={colors.success}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <StatsCard
              icon="cash-outline"
              label="Total Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              color={colors.warning}
            />
          </View>
          <View style={styles.col}>
            <StatsCard
              icon="star-outline"
              label="Instructor Rating"
              value="4.9"
              color={colors.accent}
            />
          </View>
        </View>
      </View>

      {/* Courses List */}
      <View style={[styles.section, { marginTop: spacing.md }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Course Performance</Text>
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => {}}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, padding: spacing.xl }]}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No metrics available</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create and publish a course to view performance metrics.</Text>
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsSection: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});
