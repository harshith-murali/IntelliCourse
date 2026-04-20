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
import { useAuth } from '../../hooks';
import { Button } from '../../components';

type UserRole = 'student' | 'instructor';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const { signup, isLoading } = useAuth();

  const handleSignup = async () => {
    if (!email || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signup(email, name, role);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Signup Failed', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join IntelliCourse</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9ca3af"
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
                onPress={() => setRole('student')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'student' && styles.roleButtonTextActive,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'instructor' && styles.roleButtonActive]}
                onPress={() => setRole('instructor')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'instructor' && styles.roleButtonTextActive,
                  ]}
                >
                  Instructor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            size="large"
            style={styles.button}
          />

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Button
              label="Sign In"
              onPress={() => router.push('/auth/login')}
              variant="secondary"
              size="small"
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
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  button: {
    marginTop: 8,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
});
