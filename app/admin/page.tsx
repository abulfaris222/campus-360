'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login');
      else setEmail(data.user.email ?? '');
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="admin-page">
      <div className="admin-card">
        <div className="login-logo">SC</div>
        <h1>Admin Dashboard</h1>
        <p>Signed in as {email}</p>
        <div className="admin-placeholder">
          <b>Admin tools are coming next.</b>
          <span>Reports, users, SOS alerts, WasteVision and resolved-report management will be added here.</span>
        </div>
        <button className="login-button" onClick={logout}>Sign out</button>
      </div>
    </main>
  );
}
