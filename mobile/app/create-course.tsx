import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth, useCourse, useTheme } from '../hooks';
import { Button } from '../components';
import { Ionicons } from '@expo/vector-icons';

type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export default function CreateCourseScreen() {
  const { user } = useAuth();
  const { createCourse, isLoading } = useCourse();
  const { colors, spacing, radii, shadow } = useTheme();

  // All hooks must be declared before any early returns (React rules of hooks)
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [price, setPrice] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/manage');
    }
  };

  const canCreateCourse = user?.role === 'instructor' || user?.role === 'admin';

  // RBAC: only instructors/admins can create courses
  useEffect(() => {
    if (user && !canCreateCourse) {
      Alert.alert('Access Denied', 'Only instructors and admins can create courses.', [
        { text: 'Go Back', onPress: () => router.replace('/(tabs)/home') },
      ]);
    }
  }, [canCreateCourse, user]);

  if (!user || !canCreateCourse) {
    return null; // render nothing while redirect fires
  }

  const categories = [
    'Programming',
    'Design',
    'Business',
    'Mobile Development',
    'Web Development',
    'Data Science',
  ];

  const levels: CourseLevel[] = ['beginner', 'intermediate', 'advanced'];

  const handleCreate = async () => {
    if (!title || !description || !category || price.trim() === '') {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    const cleanPriceStr = price.replace(/usd/gi, '').trim();
    const parsedPrice = parseFloat(cleanPriceStr);
    if (isNaN(parsedPrice)) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      await createCourse({
        title,
        description,
        category,
        level,
        price: parsedPrice,
      });
      
      Alert.alert('Success 🎉', 'Course created successfully! Add lectures in the next step.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/manage');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={{ marginLeft: -8, padding: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadow }]}>
          
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Course Title *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'title' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="e.g. Master React Native from Scratch"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('title')}
              onBlur={() => setIsFocused(null)}
            />
          </View>

          {/* Subtitle */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Subtitle / Short Headline</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'subtitle' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="e.g. Build iOS, Android, and Web apps with Expo"
              value={subtitle}
              onChangeText={setSubtitle}
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('subtitle')}
              onBlur={() => setIsFocused(null)}
            />
          </View>

          {/* Description */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Detailed Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'description' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }
              ]}
              placeholder="Write a compelling overview of what your students will learn."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!isLoading}
              onFocus={() => setIsFocused('description')}
              onBlur={() => setIsFocused(null)}
            />
          </View>

          {/* Category Selector */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text, marginBottom: spacing.xs }]}>Category *</Text>
            <View style={styles.selectContainer}>
              {categories.map((cat) => {
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.selectOption,
                      { 
                        backgroundColor: isActive ? colors.primaryLight : colors.background, 
                        borderColor: isActive ? colors.primary : colors.border,
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        { color: isActive ? colors.primary : colors.textSecondary },
                        isActive && { fontWeight: '600' }
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Level Selector */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text, marginBottom: spacing.xs }]}>Target Audience Level *</Text>
            <View style={styles.levelContainer}>
              {levels.map((lv) => {
                const isActive = level === lv;
                return (
                  <TouchableOpacity
                    key={lv}
                    style={[
                      styles.levelButton,
                      { 
                        backgroundColor: isActive ? colors.primary : colors.background, 
                        borderColor: isActive ? colors.primary : colors.border,
                        borderRadius: radii.md,
                        paddingVertical: spacing.md - 2
                      },
                    ]}
                    onPress={() => setLevel(lv)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.levelButtonText,
                        { color: isActive ? '#ffffff' : colors.textSecondary },
                      ]}
                    >
                      {lv.charAt(0).toUpperCase() + lv.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Price */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price *</Text>
            <View 
              style={[
                styles.priceInputContainer, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: isFocused === 'price' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  paddingLeft: spacing.md
                }
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text, paddingVertical: spacing.md - 2 }]}
                placeholder="0.00 (Enter 0 for free)"
                value={price}
                onChangeText={setPrice}
                keyboardType="default"
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
                onFocus={() => setIsFocused('price')}
                onBlur={() => setIsFocused(null)}
              />
            </View>
          </View>

          {/* Action Button cluster */}
          <View style={[styles.buttonGroup, { marginTop: spacing.lg, gap: spacing.sm }]}>
            <Button
              label={isLoading ? "Saving Course..." : "Create Course"}
              onPress={handleCreate}
              loading={isLoading}
              size="large"
            />
            <Button
              label="Cancel"
              onPress={handleBack}
              variant="secondary"
              size="large"
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  levelButton: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'column',
  },
});
