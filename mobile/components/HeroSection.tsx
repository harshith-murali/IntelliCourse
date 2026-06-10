import React, { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export function HeroSection({ title, subtitle, icon = 'school' }: HeroSectionProps) {
  const { colors, isDark } = useTheme();

  return (
    <LinearGradient colors={[colors.primary, colors.accent, colors.info]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={40} color="#fff" />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={[styles.decorative, { opacity: isDark ? 0.15 : 0.2 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 26,
    borderRadius: 26,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.36)',
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 12,
    width: 72,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
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
