import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  caption?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  color,
  caption,
}) => {
  const { colors, radii, spacing, shadow } = useTheme();
  const iconColor = color || colors.primary;

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderColor: colors.border,
          borderWidth: 1,
          padding: spacing.md,
          ...shadow
        }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconColor + '14', borderRadius: radii.lg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.text }]}>
          {value}
        </Text>
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.xs / 2 }]}>
          {label}
        </Text>
        {caption ? <Text style={[styles.caption, { color: iconColor }]}>{caption}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 86,
  },
  iconBox: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
  },
  caption: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
});
