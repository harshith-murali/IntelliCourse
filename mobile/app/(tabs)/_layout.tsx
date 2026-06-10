import React from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, TouchableOpacity, View } from 'react-native';
import { useAuth, useTheme } from '../../hooks';
import { getUserAvatarUri } from '../../utils/images';

function BackToHome({ color }: { color: string }) {
  return (
    <View style={{ width: 104, paddingLeft: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/home')}
        style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={22} color={color} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  const { user, profileVersion } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const isStudent = user?.role === 'student';
  const isCreatorRole = user?.role === 'instructor' || user?.role === 'admin';
  const tabBarBackground = isDark ? '#11101d' : colors.surface;

  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#9ca3af',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderColor: colors.border,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderRadius: 28,
          borderWidth: isDark ? 1 : 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          marginBottom: 14,
          marginHorizontal: 16,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 18,
          elevation: 8,
        },
        headerLeft: () => (
          <View style={{ width: 104 }} />
        ),
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 16,
        },
        headerShadowVisible: false,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 16 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.primary} />
            </TouchableOpacity>
            <Image
              key={`tab-avatar-${profileVersion}-${user?.avatar || ''}`}
              source={{ uri: getUserAvatarUri(user, profileVersion) }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          headerShown: true,
          // Fully hide from students — href:null removes tab & blocks navigation
          href: isStudent ? null : undefined,
          headerLeft: () => <BackToHome color={colors.primary} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          headerShown: true,
          href: isStudent ? null : undefined,
          headerLeft: () => <BackToHome color={colors.primary} />,
        }}
      />

      <Tabs.Screen
        name="courses"
        options={{
          title: 'Explore Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerShown: true,
          href: isCreatorRole ? null : undefined,
          headerLeft: () => <BackToHome color={colors.primary} />,
        }}
      />

      <Tabs.Screen
        name="my-courses"
        options={{
          title: 'My Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
          headerShown: true,
          href: isCreatorRole ? null : undefined,
          headerLeft: () => <BackToHome color={colors.primary} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerShown: true,
          headerLeft: () => <BackToHome color={colors.primary} />,
        }}
      />
    </Tabs>
  );
}
