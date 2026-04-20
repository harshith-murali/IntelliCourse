import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCourse } from '../../hooks';
import { CourseCard, LoadingSpinner } from '../../components';
import { router } from 'expo-router';
import { useState } from 'react';

export default function CoursesScreen() {
  const { courses, isLoading, getCourses } = useCourse();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getCourses();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Courses List */}
      {filteredCourses.length > 0 ? (
        <View>
          <Text style={styles.resultsText}>
            Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </Text>
          {filteredCourses.map((course) => (
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
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No courses found</Text>
          <Text style={styles.emptySubtext}>Try a different search</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginBottom: 24,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
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
  },
});
