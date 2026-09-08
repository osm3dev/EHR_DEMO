import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('jennifer.adams@gulfcoasthp.org');
  const [password, setPassword] = useState('demo1234');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(email);
      setLoading(false);
      if (ok) navigate('/dashboard');
      else setError('We could not find an account for that email. Try a demo account below.');
    }, 550);
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Sentinel EHR</p>
            <p className="text-sm text-brand-200">Clinical Documentation Risk Intelligence</p>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Stop auditing charts one by one.
          </h1>
          <p className="mt-4 text-brand-100">
            Sentinel continuously evaluates every chart, surfaces documentation risk, assigns corrective
            work, and verifies resolution — so nurse leaders get a command center instead of a stack of
            reports.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              ['Detect', 'Every chart, continuously'],
              ['Explain', 'Why it was flagged'],
              ['Verify', 'Correction confirmed'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 p-3">
                <p className="text-sm font-semibold">{k}</p>
                <p className="mt-1 text-xs text-brand-200">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-300">
          Prototype environment using synthetic demonstration data. Not intended for clinical use.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-semibold text-ink-900">Sentinel EHR</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Use your organization credentials to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-600">
                <input
                  type="checkbox"
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="font-medium text-brand-700 hover:underline">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50/70 p-3 text-xs text-ink-500">
            <div className="mb-1.5 flex items-center gap-1.5 font-medium text-ink-600">
              <Lock className="h-3.5 w-3.5" /> Secure system — access is monitored and logged
            </div>
            This system contains confidential information. Unauthorized access or use is prohibited and
            may be subject to disciplinary and legal action. All activity is recorded in the audit log.
          </div>

          <details className="mt-4 text-xs text-ink-500">
            <summary className="cursor-pointer font-medium text-ink-600">Demo accounts</summary>
            <ul className="mt-2 space-y-1">
              <li>
                <button className="text-brand-700 hover:underline" onClick={() => setEmail('jennifer.adams@gulfcoasthp.org')}>
                  jennifer.adams@gulfcoasthp.org
                </button>{' '}
                — Director of Nursing
              </li>
              <li>
                <button className="text-brand-700 hover:underline" onClick={() => setEmail('amanda.martinez@gulfcoasthp.org')}>
                  amanda.martinez@gulfcoasthp.org
                </button>{' '}
                — Registered Nurse
              </li>
              <li>
                <button className="text-brand-700 hover:underline" onClick={() => setEmail('emily.chen@gulfcoasthp.org')}>
                  emily.chen@gulfcoasthp.org
                </button>{' '}
                — Compliance
              </li>
              <li className="text-ink-400">Password: any value (prototype)</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
