import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import InputField from '@/components/InputField';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/constants/theme';

const isValidEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email.trim());

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!isValidEmail(email)) {
      setError('כתובת האימייל אינה תקינה');
      return;
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🎬</Text>
          <Text style={styles.logoText}>הרשמה ל-RateFlix</Text>
          <Text style={styles.logoSub}>צרו חשבון והתחילו לדרג</Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="אימייל"
            value={email}
            onChangeText={setEmail}
            placeholder="הזן אימייל"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <InputField
            label="סיסמה"
            value={password}
            onChangeText={setPassword}
            placeholder="לפחות 6 תווים"
            secureTextEntry
          />
          <InputField
            label="אימות סיסמה"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="הזן שוב את הסיסמה"
            secureTextEntry
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleRegister}
            disabled={submitting}
            style={[styles.button, submitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{submitting ? 'נרשם...' : 'הרשמה'}</Text>
          </Pressable>

          <Link href="/login" style={styles.link}>
            כבר יש לך חשבון? להתחברות
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoEmoji: {
    fontSize: 56,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
  },
  logoSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'right',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
