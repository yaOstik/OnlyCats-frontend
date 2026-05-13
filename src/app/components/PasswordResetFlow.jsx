import { useMemo, useState } from 'react';

const ENDPOINT_CANDIDATES = {
  request: [
    '/password/forgot',
    '/password/forgot/',
  ],
  confirm: [
    '/password/reset',
    '/password/reset/',
  ],
};

async function postToFirstAvailable(baseUrl, endpointList, payload) {
  let lastError = 'Password reset is temporarily unavailable.';
  for (const endpoint of endpointList) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        return data;
      }

      if (response.status === 404) {
        continue;
      }

      let detail = '';
      try {
        const errorBody = await response.json();
        detail = errorBody?.detail || errorBody?.message || '';
      } catch {
        detail = '';
      }
      lastError = detail || `Request failed (${response.status}).`;
    } catch {
      lastError = 'Network error. Please try again.';
    }
  }

  throw new Error(lastError);
}

export default function PasswordResetFlow({
  baseUrl,
  defaultEmail = '',
  title = 'Reset Password',
  onDone,
}) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canProceed = useMemo(() => {
    if (step === 1) return /\S+@\S+\.\S+/.test(email);
    if (step === 2) return /^\d{6}$/.test(code);
    return password.trim().length >= 8;
  }, [code, email, password, step]);

  const requestCode = async (event) => {
    event.preventDefault();
    if (!canProceed) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await postToFirstAvailable(baseUrl, ENDPOINT_CANDIDATES.request, { email: email.trim() });
      setMessage('We sent a 6-digit code to your email.');
      setStep(2);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (!canProceed) return;
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter a valid 6-digit code.');
      return;
    }
    setStep(3);
    setMessage('Code confirmed. Set your new password.');
  };

  const confirmPassword = async (event) => {
    event.preventDefault();
    if (!canProceed) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await postToFirstAvailable(baseUrl, ENDPOINT_CANDIDATES.confirm, {
        token: code.trim(),
        new_password: password,
      });
      if (rememberMe) {
        localStorage.setItem('remembered_email', email.trim());
      } else {
        localStorage.removeItem('remembered_email');
      }
      onDone?.('Password changed successfully.');
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = step === 1 ? requestCode : step === 2 ? verifyCode : confirmPassword;

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-xl font-black text-gray-900">{title}</h3>
        <p className="text-sm font-medium text-gray-500 mt-1">
          Step {step} of 3
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={step > 1}
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#d946ef] focus:bg-white disabled:opacity-75"
          />
        </div>

        {step >= 2 && (
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">
              6-digit code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-semibold tracking-[0.25em] text-gray-900 outline-none focus:border-[#d946ef] focus:bg-white"
            />
          </div>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">
                New password
              </label>
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#d946ef] focus:bg-white"
              />
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 accent-[#d946ef]"
              />
              <span className="text-sm font-semibold text-gray-700">Remember me</span>
            </label>
          </>
        )}

        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-500">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-fuchsia-100 bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-[#d946ef]">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={!canProceed || loading}
          className="w-full rounded-xl bg-[#d946ef] px-4 py-3.5 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-[#c026d3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Please wait...' : step === 1 ? 'Send code' : step === 2 ? 'Verify code' : 'Set password'}
        </button>
      </form>
    </div>
  );
}
