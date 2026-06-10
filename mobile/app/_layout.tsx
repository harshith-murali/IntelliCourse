import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTheme } from '../hooks';

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
          },
          headerBackTitle: '', // suppress fallback text
        }}
      >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: ' ' }} />
        <Stack.Screen
          name="course-detail"
          options={{
            headerShown: true,
            headerTitle: 'Course',
          }}
        />
        <Stack.Screen
          name="video-player"
          options={{
            headerShown: true,
            headerTitle: 'Lesson',
          }}
        />
        <Stack.Screen
          name="create-course"
          options={{
            headerShown: true,
            headerTitle: 'Create Course',
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}
