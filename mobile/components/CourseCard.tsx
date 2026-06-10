import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Course } from '../types';

import { useTheme } from '../hooks';
import { FALLBACK_COURSE_COVER, getCourseCoverUri, getUserAvatarUri } from '../utils/images';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  showEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, showEnrolled }) => {
  const { colors, radii, spacing, shadow } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const coverUri = useMemo(() => (imageFailed ? FALLBACK_COURSE_COVER : getCourseCoverUri(course)), [course, imageFailed]);
  const instructorAvatar = getUserAvatarUri(course.instructor);
  const level = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Beginner';

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.surface, 
          borderRadius: radii.xl,
          borderColor: colors.border,
          borderWidth: 1,
          ...shadow
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: coverUri }}
          style={[styles.thumbnail, { backgroundColor: colors.border }]}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
        <LinearGradient colors={['rgba(15, 23, 42, 0.04)', 'rgba(15, 23, 42, 0.42)']} style={styles.imageGradient} />
        <View style={[styles.categoryPill, { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radii.full }]}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={[styles.categoryText, { color: colors.primary }]} numberOfLines={1}>{course.category || 'General'}</Text>
        </View>
        {showEnrolled ? (
          <View style={[styles.enrolledPill, { backgroundColor: colors.success, borderRadius: radii.full }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
            <Text style={styles.enrolledText}>Enrolled</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.content, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xs }]} numberOfLines={2}>
          {course.title}
        </Text>

        <View style={[styles.instructorRow, { marginBottom: spacing.md }]}>
          <Image source={{ uri: instructorAvatar }} style={[styles.instructorAvatar, { borderRadius: radii.full }]} />
          <Text style={[styles.instructor, { color: colors.textSecondary }]} numberOfLines={1}>{course.instructor?.name || 'Instructor'}</Text>
          <Text style={[
            styles.level, 
            { 
              backgroundColor: colors.primaryLight, 
              color: colors.primary,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs / 2
            }
          ]}>
            {level}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {course.rating ? course.rating.toFixed(1) : '5.0'} <Text style={{ fontSize: 10 }}>({course.students || 0})</Text>
            </Text>
          </View>
          <View style={[styles.pricePill, { backgroundColor: colors.accentSoft, borderRadius: radii.full }]}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {course.price === 0 ? 'Free' : `₹${course.price}`}
          </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 176,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    left: 14,
    maxWidth: '64%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 14,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  enrolledPill: {
    alignItems: 'center',
    bottom: 14,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    right: 14,
  },
  enrolledText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructorAvatar: {
    height: 24,
    width: 24,
  },
  instructor: {
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  level: {
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
  },
});
