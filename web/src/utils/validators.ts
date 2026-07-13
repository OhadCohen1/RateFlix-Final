export const isValidEmail = (email: string): boolean =>
  /^\S+@\S+\.\S+$/.test(email.trim());

export const MIN_PASSWORD_LENGTH = 6;

export const isValidPassword = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH;

export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** Shared validation for the login/register forms; returns field-level Hebrew errors */
export const validateAuthForm = (
  email: string,
  password: string,
  confirmPassword?: string
): AuthFormErrors => {
  const errors: AuthFormErrors = {};

  if (!email.trim()) {
    errors.email = 'נא להזין אימייל';
  } else if (!isValidEmail(email)) {
    errors.email = 'כתובת האימייל אינה תקינה';
  }

  if (!password) {
    errors.password = 'נא להזין סיסמה';
  } else if (!isValidPassword(password)) {
    errors.password = `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'הסיסמאות אינן תואמות';
  }

  return errors;
};
