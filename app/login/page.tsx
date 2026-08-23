'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

const VISIT_KEY = 'smart-campus-360-logged-in';

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

    const campusRegister = registerNumber.trim().toLowerCase();
    const loginEmail = `${campusRegister}@campus.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

    if (error || !data.user) {
      setMessage('Invalid register number or password.');
      setLoading(false);
      return;
    }

    const knownRole = campusRegister === 'admin001' ? 'admin' : campusRegister === 'staff001' ? 'staff' : 'student';
    sessionStorage.setItem(VISIT_KEY, 'true');
    sessionStorage.setItem('campus-register-number', campusRegister);
    sessionStorage.setItem('campus-role', knownRole);

    // Keep the authenticated account's campus identity in metadata.
    await supabase.auth.updateUser({
      data: { register_number: campusRegister, role: knownRole },
    });

    // Keep the profile role/register number synchronized for pages that read profiles.
    // This makes staff001 consistently behave as Staff and admin001 as Admin.
    await supabase.from('profiles').update({
      register_number: campusRegister,
      role: knownRole,
    }).eq('id', data.user.id);

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
          <input id="register-number" type="text" inputMode="text" autoComplete="username" placeholder="Enter your register number" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {message && <p className="login-error">{message}</p>}
          <button className="login-button" disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="login-note">Use the register number issued by your college.</p>
      </section>
    </main>
  );
}
