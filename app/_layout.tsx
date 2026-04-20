import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ animationEnabled: false }}>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      <StatusBar style="dark" />
    </>
  );
}
