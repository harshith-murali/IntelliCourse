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
import { useAuth, useTheme } from '../../hooks';
import { Button } from '../../components';

type UserRole = 'student' | 'instructor';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const { signup, isLoading } = useAuth();
  const { colors, spacing, radii, shadow } = useTheme();

  const handleSignup = async () => {
    if (!email || !name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character (!@#$%^&*)');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signup(email, name, role, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      const message = (error as Error).message || '';
      const alreadyExists =
        message.toLowerCase().includes('already exists') ||
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('email');

      if (alreadyExists) {
        Alert.alert(
          'Account Already Exists',
          `An account with ${email} already exists. Would you like to sign in instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else {
        Alert.alert('Signup Failed', message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xs }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join IntelliCourse to start learning</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, ...shadow }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'name' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('name')}
              onBlur={() => setIsFocused(null)}
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'email' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('email')}
              onBlur={() => setIsFocused(null)}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'password' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="Min 8 chars, 1 uppercase, 1 special char"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: isFocused === 'confirmPassword' ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md - 2
                }
              ]}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
              onFocus={() => setIsFocused('confirmPassword')}
              onBlur={() => setIsFocused(null)}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.label, { color: colors.text, marginBottom: spacing.xs }]}>I want to...</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { 
                    backgroundColor: role === 'student' ? colors.primaryLight : colors.background, 
                    borderColor: role === 'student' ? colors.primary : colors.border,
                    borderRadius: radii.md,
                    paddingVertical: spacing.md - 2
                  },
                ]}
                onPress={() => setRole('student')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: role === 'student' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Learn (Student)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { 
                    backgroundColor: role === 'instructor' ? colors.primaryLight : colors.background, 
                    borderColor: role === 'instructor' ? colors.primary : colors.border,
                    borderRadius: radii.md,
                    paddingVertical: spacing.md - 2
                  },
                ]}
                onPress={() => setRole('instructor')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: role === 'instructor' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Teach (Instructor)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            size="large"
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.loginPrompt}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 13,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
