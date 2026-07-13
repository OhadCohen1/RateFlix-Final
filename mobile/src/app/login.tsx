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

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('נא למלא אימייל וסיסמה');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🎬</Text>
          <Text style={styles.logoText}>RateFlix</Text>
          <Text style={styles.logoSub}>מערכת המלצות מבוססת KNN</Text>
        </View>

        {/* Form card */}
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
            placeholder="הזן סיסמה"
            secureTextEntry
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={[styles.button, submitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{submitting ? 'מתחבר...' : 'התחבר'}</Text>
          </Pressable>

          <View style={styles.demoHint}>
            <Text style={styles.demoText}>דמו: demo@rateflix.com / demo123</Text>
          </View>

          <Link href="/register" style={styles.link}>
            אין לך חשבון? הירשם עכשיו
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
    fontSize: 34,
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
  demoHint: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 13,
    color: colors.primaryDark,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
