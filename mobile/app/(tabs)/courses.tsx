import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCourse, useTheme } from '../../hooks';
import { CourseCard, SectionHeader, StatsCard } from '../../components';
import { SkeletonCard } from '../../components/LoadingSpinner';
import { router } from 'expo-router';

const CATEGORIES = [
  'All',
  'Programming',
  'Web Development',
  'Mobile Development',
  'AI / Machine Learning',
  'Data Science',
  'Cyber Security',
  'DevOps',
  'Cloud Computing',
  'Design',
  'Business',
];

export default function CoursesScreen() {
  const { courses, isLoading, getCourses } = useCourse();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { colors, spacing, radii } = useTheme();

  useEffect(() => {
    getCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (course.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: 40 }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={getCourses}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <SectionHeader title="Explore Courses" subtitle="Find polished lessons by topic, level, or instructor" />

      <View style={styles.statsGrid}>
        <View style={styles.statsCol}>
          <StatsCard icon="library-outline" label="Available" value={courses.length} />
        </View>
        <View style={styles.statsCol}>
          <StatsCard icon="filter-outline" label="Filtered" value={filteredCourses.length} color={colors.info} />
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.full },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={[styles.chipsScroll, { marginBottom: spacing.md }]}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderWidth: 1,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive ? '#ffffff' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      {!isLoading && (
        <Text style={[styles.resultsText, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {filteredCourses.length === 0
            ? 'No courses found'
            : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`}
        </Text>
      )}

      {/* Course List */}
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : filteredCourses.length > 0 ? (
        filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() =>
              router.push({ pathname: '/course-detail', params: { courseId: course.id } })
            }
          />
        ))
      ) : (
        <View style={[styles.emptyState, { paddingVertical: 60 }]}>
          <Ionicons name="telescope-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.text, marginTop: spacing.md }]}>
            No courses found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginTop: 4 }]}>
            {selectedCategory !== 'All'
              ? `No courses in "${selectedCategory}" yet. Try a different category.`
              : 'Try a different search term.'}
          </Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity
              onPress={() => setSelectedCategory('All')}
              style={[
                styles.clearButton,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginTop: spacing.md,
                },
              ]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                Show All Courses
              </Text>
            </TouchableOpacity>
          )}
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsCol: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '500',
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
    textAlign: 'center',
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
