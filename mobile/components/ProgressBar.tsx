import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../hooks';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showLabel = true,
  color,
  height = 6
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const { colors, radii, spacing } = useTheme();

  const progressColor = color || (clampedProgress === 100 ? colors.success : colors.primary);

  return (
    <View>
      <View style={[styles.container, { backgroundColor: colors.border, height, borderRadius: radii.full }]}>
        <LinearGradient
          colors={[progressColor, clampedProgress === 100 ? colors.success : colors.info]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill, 
            { 
              width: `${clampedProgress}%`, 
              borderRadius: radii.full 
            }
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {Math.round(clampedProgress)}% complete
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
