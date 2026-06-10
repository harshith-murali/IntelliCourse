import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lesson } from '../types';

import { useTheme } from '../hooks';

interface LessonItemProps {
  lesson: Lesson;
  onPress: () => void;
  isActive?: boolean;
  onDelete?: () => void;
  onToggleComplete?: () => void;
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onPress, isActive, onDelete, onToggleComplete }) => {
  const { colors, spacing, radii } = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        { 
          borderBottomColor: colors.border,
          backgroundColor: isActive ? colors.surfaceHover : 'transparent',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
        }
      ]} 
    >
      <View style={styles.leftContent}>
        <TouchableOpacity
          style={[
            styles.icon,
            { borderRadius: radii.full },
            lesson.completed && { backgroundColor: colors.success + '15' }
          ]}
          onPress={onToggleComplete}
          disabled={!onToggleComplete}
          activeOpacity={0.7}
        >
          {lesson.completed ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          ) : (
            <Ionicons name="play-circle" size={20} color={isActive ? colors.primary : colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.leftContentTouch}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.textContent}>
            <Text 
              style={[
                styles.title, 
                { 
                  color: isActive ? colors.primary : colors.text,
                  fontWeight: isActive ? '600' : '400'
                }
              ]} 
              numberOfLines={2}
            >
              {lesson.title}
            </Text>
            <Text style={[styles.duration, { color: colors.textSecondary }]}>
              Video • {formatDuration(lesson.duration)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>


      {onDelete ? (
        <TouchableOpacity 
          onPress={onDelete}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error || '#ef4444'} />
        </TouchableOpacity>
      ) : (
        <Ionicons 
          name={isActive ? "play" : "chevron-forward"} 
          size={16} 
          color={isActive ? colors.primary : colors.border} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftContentTouch: {
    flex: 1,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  duration: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
