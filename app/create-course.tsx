import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useAuth, useCourse } from '../hooks';
import { Button } from '../components';

type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export default function CreateCourseScreen() {
  const { user } = useAuth();
  const { createCourse, isLoading } = useCourse();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [price, setPrice] = useState('');

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
    if (!title || !description || !category || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await createCourse({
        title,
        description,
        category,
        level,
        price: parseFloat(price),
      });
      Alert.alert('Success', 'Course created successfully!', [
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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create New Course</Text>

        {/* Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Course Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter course title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9ca3af"
            editable={!isLoading}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your course"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>

        {/* Category */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.selectContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.selectOption,
                  category === cat && styles.selectOptionActive,
                ]}
                onPress={() => setCategory(cat)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    category === cat && styles.selectOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Level */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Level *</Text>
          <View style={styles.levelContainer}>
            {levels.map((lv) => (
              <TouchableOpacity
                key={lv}
                style={[
                  styles.levelButton,
                  level === lv && styles.levelButtonActive,
                ]}
                onPress={() => setLevel(lv)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.levelButtonText,
                    level === lv && styles.levelButtonTextActive,
                  ]}
                >
                  {lv.charAt(0).toUpperCase() + lv.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Price ($) *</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            label="Create Course"
            onPress={handleCreate}
            loading={isLoading}
            size="large"
          />
          <Button
            label="Cancel"
            onPress={() => router.back()}
            variant="secondary"
            size="large"
            disabled={isLoading}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  selectOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  selectOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111',
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    marginTop: 0,
  },
});
