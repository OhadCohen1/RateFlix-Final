import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { validateAuthForm } from '../utils/validators';
import type { AuthFormErrors } from '../utils/validators';
import { getApiErrorMessage } from '../utils/errors';

const RegisterScreen = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');

    const validation = validateAuthForm(email, password, confirmPassword);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (error) {
      setApiError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 text-3xl font-black text-zinc-50">הרשמה</h1>
      <p className="mb-8 text-zinc-400">צרו חשבון חדש והתחילו לדרג</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          label="אימייל"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
        />
        <InputField
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          dir="ltr"
        />
        <InputField
          label="אימות סיסמה"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          dir="ltr"
        />

        {apiError && (
          <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'נרשם...' : 'הרשמה'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        כבר יש לכם חשבון?{' '}
        <Link to="/login" className="font-medium text-brand-400 hover:underline">
          להתחברות
        </Link>
      </p>
    </main>
  );
};

export default RegisterScreen;
