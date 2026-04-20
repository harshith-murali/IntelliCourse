import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lesson } from '../types';

interface LessonItemProps {
  lesson: Lesson;
  onPress: () => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
};

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <View
          style={[styles.icon, lesson.completed && styles.completedIcon]}
        >
          {lesson.completed ? (
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          ) : (
            <Ionicons name="play-circle" size={24} color="#9ca3af" />
          )}
        </View>

        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {lesson.title}
          </Text>
          <Text style={styles.duration}>{formatDuration(lesson.duration)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: '#f0fdf4',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
