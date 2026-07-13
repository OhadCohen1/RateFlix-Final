import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from '../constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

const InputField = ({ label, error, ...inputProps }: InputFieldProps) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !!error && styles.inputError]}
      placeholderTextColor={colors.textFaint}
      {...inputProps}
    />
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'right',
  },
});

export default InputField;
