'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const loginEmail = `${registerNumber.trim().toLowerCase()}@campus.local`;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

    if (error) {
      setMessage('Invalid register number or password.');
      setLoading(false);
      return;
    }

    router.push('/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">SC</div>
        <h1>Welcome to Smart Campus 360</h1>
        <p className="login-subtitle">Sign in using your register number and password.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="register-number">Register number</label>
          <input
            id="register-number"
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="Enter your register number"
            value={registerNumber}
            onChange={(e) => setRegisterNumber(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && <p className="login-error">{message}</p>}

          <button className="login-button" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-note">Use the register number issued by your college.</p>
      </section>
    </main>
  );
}
