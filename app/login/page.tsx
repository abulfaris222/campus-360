'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push(role === 'admin' ? '/admin' : '/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">SC</div>
        <h1>Welcome to Smart Campus 360</h1>
        <p className="login-subtitle">Sign in to access your campus services.</p>

        <form onSubmit={handleLogin}>
          <label>Account type</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="faculty">Faculty / Staff</option>
            <option value="admin">Admin</option>
          </select>

          <label>Email</label>
          <input type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {message && <p className="login-error">{message}</p>}

          <button className="login-button" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-note">Your password is handled securely by Supabase Authentication.</p>
      </section>
    </main>
  );
}
