import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showLabel = true }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View>
      <View style={styles.container}>
        <View
          style={[styles.fill, { width: `${clampedProgress}%` }]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(clampedProgress)}% complete</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
});
