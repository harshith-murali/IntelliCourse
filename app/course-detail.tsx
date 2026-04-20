import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useCourse } from '../hooks';
import { LessonItem, LoadingSpinner, Button, ProgressBar } from '../components';
import { router } from 'expo-router';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const { currentCourse, isLoading, getCourseById, enrollInCourse, getMyCourses } =
    useCourse();

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId);
    }
  }, [courseId]);

  if (isLoading || !currentCourse) {
    return <LoadingSpinner />;
  }

  const isEnrolled = false;

  const handleEnroll = async () => {
    if (!user?.id) return;

    try {
      await enrollInCourse(user.id, currentCourse.id);
      await getMyCourses(user.id);
      Alert.alert('Success', 'You have been enrolled in this course!');
      router.back();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    router.push({
      pathname: '/video-player',
      params: { courseId: currentCourse.id, lessonId },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Thumbnail */}
      <Image source={{ uri: currentCourse.thumbnail }} style={styles.thumbnail} />

      {/* Course Info */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>{currentCourse.title}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-circle" size={16} color="#666" />
            <Text style={styles.metaText}>{currentCourse.instructor.name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.metaText}>{currentCourse.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.metaText}>{currentCourse.students} students</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>${currentCourse.price}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentCourse.level}</Text>
          </View>
        </View>

        <Text style={styles.description}>{currentCourse.description}</Text>

        {!isEnrolled && (
          <Button
            label="Enroll Now"
            onPress={handleEnroll}
            size="large"
            style={styles.enrollButton}
          />
        )}

        {isEnrolled && (
          <ProgressBar progress={50} showLabel={true} />
        )}
      </View>

      {/* Lessons */}
      {currentCourse.lessons.length > 0 && (
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>
            Course Content ({currentCourse.lessons.length} lessons)
          </Text>

          {currentCourse.lessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              onPress={() => handleStartLesson(lesson.id)}
            >
              <LessonItem
                lesson={lesson}
                onPress={() => handleStartLesson(lesson.id)}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Instructor */}
      <View style={styles.instructorSection}>
        <Text style={styles.sectionTitle}>About Instructor</Text>
        <View style={styles.instructorCard}>
          <Image
            source={{ uri: currentCourse.instructor.avatar }}
            style={styles.instructorAvatar}
          />
          <View style={styles.instructorInfo}>
            <Text style={styles.instructorName}>{currentCourse.instructor.name}</Text>
            <Text style={styles.instructorBio}>{currentCourse.instructor.bio}</Text>
          </View>
        </View>
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
    paddingBottom: 32,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  enrollButton: {
    marginTop: 8,
  },
  lessonsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  instructorSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  instructorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  instructorBio: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
