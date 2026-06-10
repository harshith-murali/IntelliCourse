import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks';

export const LoadingSpinner: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export const SkeletonCard: React.FC = () => {
  const { colors, radii, spacing, shadow } = useTheme();

  return (
    <View 
      style={[
        styles.skeletonCard, 
        { 
          backgroundColor: colors.surface, 
          borderRadius: radii.md,
          borderColor: colors.border,
          borderWidth: 1,
          padding: spacing.md,
          ...shadow
        }
      ]}
    >
      <View style={[styles.skeletonThumb, { backgroundColor: colors.border, borderRadius: radii.sm }]} />
      <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '70%', height: 16, marginTop: spacing.sm, borderRadius: radii.sm }]} />
      <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%', height: 12, marginTop: spacing.xs, borderRadius: radii.sm }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCard: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  skeletonThumb: {
    width: '100%',
    height: 120,
  },
  skeletonLine: {
    opacity: 0.6,
  }
});
