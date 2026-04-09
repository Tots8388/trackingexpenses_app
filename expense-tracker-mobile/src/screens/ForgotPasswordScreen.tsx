import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { requestPasswordReset, confirmPasswordReset } from '../api/endpoints';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code' | 'done';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep('code');
      Alert.alert('Code Sent', 'If an account with that email exists, a 6-digit code has been sent. Check your inbox.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send reset code. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(email.trim(), code.trim(), newPassword);
      setStep('done');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid or expired code. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.primary }]}>🔒</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {step === 'done' ? 'Password Reset!' : 'Reset Password'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && 'Enter the 6-digit code and your new password'}
            {step === 'done' && 'Your password has been updated successfully'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {step === 'email' && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter your email"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleRequestCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>6-Digit Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="At least 8 characters"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={theme.textMuted}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRequestCode} style={styles.resendRow}>
                <Text style={[styles.resendText, { color: theme.textMuted }]}>
                  Didn't get the code?{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {step !== 'done' && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              Remember your password?{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: { fontSize: 13 },
  linkRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: { fontSize: 14 },
});
