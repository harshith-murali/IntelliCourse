import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function HeroSection({ title, subtitle, icon = 'school' }: HeroSectionProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        <Ionicons name={icon} size={64} color="#fff" style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={[styles.decorative, { opacity: isDark ? 0.15 : 0.2 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  decorative: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 200,
    height: 200,
  },
  circle1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 10,
    right: 20,
  },
  circle2: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 40,
    right: 80,
  },
  circle3: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 10,
    right: 30,
  },
});
