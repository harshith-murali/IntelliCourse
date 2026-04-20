import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useCourse } from '../hooks';
import { LoadingSpinner } from '../components';
import { router } from 'expo-router';

export default function VideoPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
  }>();
  const { currentCourse, getCourseById, isLoading } = useCourse();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId);
    }
  }, [courseId]);

  if (isLoading || !currentCourse) {
    return <LoadingSpinner />;
  }

  const lesson = currentCourse.lessons.find((l) => l.id === lessonId);

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Lesson not found</Text>
      </View>
    );
  }

  const handleMarkComplete = () => {
    Alert.alert('Success', 'Lesson marked as complete!', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: lesson.videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={(status: any) => {
            if (status.isLoaded && status.isPlaying) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          }}
        />
      </View>

      {/* Lesson Info */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.description}>{lesson.description}</Text>

        {/* Duration */}
        <View style={styles.durationContainer}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.durationText}>
            {Math.floor(lesson.duration / 60)} minutes
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.button} onPress={handleMarkComplete}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Mark as Complete</Text>
        </TouchableOpacity>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#3b82f6" />
            <Text style={styles.navButtonText}>Back to Course</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  navButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  navButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#3b82f6',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
});
