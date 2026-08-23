'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const VISIT_KEY = 'smart-campus-360-logged-in';
const modules = [
  ['📝', 'Smart Complaints', 'Report maintenance, facilities, or campus issues.', '/complaints'],
  ['🛒', 'Campus Marketplace', 'Buy and sell useful items at student-friendly prices.', '/marketplace'],
  ['🔎', 'Lost & Found', 'Post and discover lost items around campus.', '/lost-found'],
  ['📚', 'Study Hub', 'Access notes, resources, schedules, and study tools.', '/study-hub'],
  ['🛡️', 'Admin Dashboard', 'Manage reports, users, and campus activity.', '/admin'],
] as const;

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ register_number: string; role: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setProfile({ register_number: 'student001', role: 'student' });
          setProfileLoading(false);
        }
        return;
      }

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const emailRegister = (user.email ?? '').split('@')[0].trim().toLowerCase();
      const metadataRegister = typeof metadata.register_number === 'string' ? metadata.register_number.trim() : '';
      const metadataRole = typeof metadata.role === 'string' ? metadata.role.trim().toLowerCase() : '';

      const { data: p, error } = await supabase
        .from('profiles')
        .select('register_number,role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) console.warn('Profile lookup failed:', error.message);

      const sessionRegister = typeof window !== 'undefined' ? (sessionStorage.getItem('campus-register-number') ?? '').trim() : '';
      const sessionRole = typeof window !== 'undefined' ? (sessionStorage.getItem('campus-role') ?? '').trim().toLowerCase() : '';
      const registerNumber = (sessionRegister || p?.register_number || metadataRegister || emailRegister || 'student001').trim();
      const loginRole = registerNumber.toLowerCase() === 'admin001' ? 'admin' : registerNumber.toLowerCase() === 'staff001' ? 'staff' : 'student';
      const role = (sessionRole || loginRole || p?.role || metadataRole || 'student').trim().toLowerCase();

      if (active) {
        setProfile({ register_number: registerNumber, role });
        setProfileLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    sessionStorage.removeItem(VISIT_KEY);
    sessionStorage.removeItem('campus-role');
    sessionStorage.removeItem('campus-register-number');
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const role = (profile?.role ?? 'student').trim().toLowerCase();
  const register = (profile?.register_number ?? '').trim().toLowerCase();
  const isAdmin = role === 'admin' || register === 'admin001';
  const roleLabel = isAdmin ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1);
  const visibleModules = isAdmin ? modules : modules.filter(([, , , href]) => href !== '/admin');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="logo">RIT</div><div><strong>RIT Campus 360</strong><span>360 • Campus Portal</span></div></div>
        <nav className="nav">
          <a className="active" href="/"><span>⌂</span> Dashboard</a>
          <a href="/complaints"><span>📝</span> Complaints</a>
          <a href="/marketplace"><span>🛒</span> Marketplace</a>
          <a href="/lost-found"><span>🔎</span> Lost &amp; Found</a>
          <a href="/study-hub"><span>📚</span> Study Hub</a>
          {isAdmin && <a href="/admin"><span>🛡️</span> Admin Dashboard</a>}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">Campus / <b>Dashboard</b></div>
          <div className="top-actions">
            <div className="user-chip">
              <span className="user-avatar">{profileLoading ? '…' : '👤'}</span>
              <span><b>{profileLoading ? 'Loading…' : profile?.register_number || 'student001'}</b><small>{roleLabel}</small></span>
            </div>
            <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
              <span className="logout-icon">↪</span>
              <span>{loggingOut ? 'Signing out…' : 'Log out'}</span>
            </button>
          </div>
        </header>

        <section className="content">
          <div className="hero">
            <div><h1>Hello, {profile?.register_number || 'student001'} 👋</h1><p>Everything you need to stay connected with your campus.</p></div>
          </div>

          <div className="section-title"><h2>Campus services</h2><span>{isAdmin ? 'Five core modules' : 'Four core modules'}</span></div>
          <div className="modules">
            {visibleModules.map(([icon, title, description, href]) => (
              <a className="card module module-link" href={href} key={title}>
                <div className="icon">{icon}</div><div><h3>{title}</h3><p>{description}</p></div><div className="arrow">›</div>
              </a>
            ))}
          </div>

          <div className="card quick">
            <div className="section-title" style={{ marginTop: 0 }}><h2>Quick actions</h2></div>
            {isAdmin && <a className="quick-link" href="/admin">🛡️ Open Admin Dashboard</a>}
            <a className="quick-link" href="/complaints">📝 Create a complaint</a>
            <a className="quick-link" href="/marketplace">🛒 Browse Marketplace</a>
            <a className="quick-link" href="/lost-found">🔎 Post a lost item</a>
            <a className="quick-link" href="/study-hub">📚 Open Study Hub</a>
          </div>
        </section>
      </main>
    </div>
  );
}
