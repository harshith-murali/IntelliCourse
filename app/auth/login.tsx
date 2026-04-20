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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks';
import { Button } from '../../components';

export default function LoginScreen() {
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('password');
  const { login, isLoading } = useAuth();

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

  const handleDemoStudent = async () => {
    try {
      await login('john@example.com', 'password');
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  const handleDemoInstructor = async () => {
    try {
      await login('sarah@example.com', 'password');
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to IntelliCourse</Text>
          <Text style={styles.subtitle}>Learn, Teach, Grow</Text>
        </View>

        <View style={styles.form}>
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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9ca3af"
              editable={!isLoading}
            />
          </View>

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            style={styles.button}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Demo Accounts</Text>
            <View style={styles.line} />
          </View>

          <Button
            label="Login as Student"
            onPress={handleDemoStudent}
            variant="secondary"
            size="large"
            style={styles.demoButton}
            disabled={isLoading}
          />

          <Button
            label="Login as Instructor"
            onPress={handleDemoInstructor}
            variant="secondary"
            size="large"
            style={styles.demoButton}
            disabled={isLoading}
          />

          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Button
              label="Sign Up"
              onPress={() => router.push('/auth/signup')}
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
  button: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  demoButton: {
    marginVertical: 6,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
});
