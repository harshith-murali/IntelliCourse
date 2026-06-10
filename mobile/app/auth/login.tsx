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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const { colors, spacing, radii, shadow } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  const handleDemoStudent = () => {
    setEmail('john@example.com');
    setPassword('Demo@1234!');
  };

  const handleDemoInstructor = () => {
    setEmail('sarah@example.com');
    setPassword('Demo@1234!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xs }]}>IntelliCourse</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Empower your future through learning</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, ...shadow }]}>
          <View style={styles.formGroup}>
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
              placeholder="Enter your password"
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

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>DEMO MODE</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.demoButtonsContainer}>
            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: colors.primaryLight, borderRadius: radii.md, paddingVertical: spacing.md }]} 
              onPress={handleDemoStudent}
              disabled={isLoading}
            >
              <Text style={[styles.demoButtonText, { color: colors.primary }]}>Student Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.demoButton, { backgroundColor: colors.primaryLight, borderRadius: radii.md, paddingVertical: spacing.md }]} 
              onPress={handleDemoInstructor}
              disabled={isLoading}
            >
              <Text style={[styles.demoButtonText, { color: colors.primary }]}>Instructor Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupPrompt}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>Do not have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  demoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 13,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
