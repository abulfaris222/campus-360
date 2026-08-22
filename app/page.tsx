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
];

const activities = [['New complaint submitted','Library — broken study-room light','8 min ago'],['New marketplace listing','Scientific calculator — ₹450','24 min ago'],['Lost item posted','Block B — calculator','1 hr ago'],['Campus notice updated','Tomorrow — seminar hall maintenance','2 hrs ago']];

type Notification = { id: string; title: string; text: string; href: string; created_at: string };

export default function Home(){
  const router = useRouter();
  const [profile, setProfile] = useState<{ register_number: string; role: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('register_number, role')
        .eq('id', user.id)
        .maybeSingle();

      if (active && profileData) setProfile(profileData);

      const [marketplace, lostFound] = await Promise.all([
        supabase.from('marketplace_messages').select('id, body, created_at').eq('recipient_id', user.id).is('read_at', null).order('created_at', { ascending: false }).limit(5),
        supabase.from('lost_found_messages').select('id, body, created_at').eq('recipient_id', user.id).is('read_at', null).order('created_at', { ascending: false }).limit(5),
      ]);

      if (!active) return;
      const items: Notification[] = [
        ...((marketplace.data ?? []) as any[]).map((n) => ({ id: `m-${n.id}`, title: 'Marketplace message', text: n.body, href: '/marketplace', created_at: n.created_at })),
        ...((lostFound.data ?? []) as any[]).map((n) => ({ id: `l-${n.id}`, title: 'Lost & Found message', text: n.body, href: '/lost-found', created_at: n.created_at })),
      ];
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(items.slice(0, 8));
    };
    loadDashboard();
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    sessionStorage.removeItem(VISIT_KEY);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Loading...';

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">SC</div><div><strong>Smart Campus</strong><span>360 • Campus Portal</span></div></div>
      <nav className="nav"><a className="active" href="/"><span>⌂</span> Dashboard</a><a href="/complaints"><span>📝</span> Complaints</a><a href="/marketplace"><span>🛒</span> Marketplace</a><a href="/lost-found"><span>🔎</span> Lost & Found</a><a href="/study-hub"><span>📚</span> Study Hub</a><a href="/admin"><span>🛡️</span> Admin</a></nav>
      <div className="side-bottom"><b>Smart Campus 360</b><p>A connected campus experience built with free-first tools.</p></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="crumb">Campus / <b>Dashboard</b></div>
        <div className="top-actions">
          <div className="notification-wrap">
            <button className="notification-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>🔔{notifications.length > 0 && <span className="notification-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>}</button>
            {showNotifications && <div className="notification-panel">
              <div className="notification-head"><b>Notifications</b><span>{notifications.length} unread</span></div>
              {notifications.length === 0 ? <p className="notification-empty">You're all caught up.</p> : notifications.map((n) => <a className="notification-item" href={n.href} key={n.id}><b>{n.title}</b><span>{n.text}</span></a>)}
            </div>}
          </div>
          <div className="user-chip"><span className="user-avatar">👤</span><span><b>{profile?.register_number ?? 'Loading...'}</b><small>{roleLabel}</small></span></div>
          <button className="logout-btn" onClick={handleLogout} disabled={loggingOut} aria-label="Log out">{loggingOut ? 'Signing out...' : '↪ Log out'}</button>
        </div>
      </header>
      <section className="content">
        <div className="hero"><div><h1>Good morning 👋</h1><p>Everything you need to stay connected with your campus.</p></div><div className="date">Saturday, 22 August 2026</div></div>
        <div className="grid"><div className="card stat"><div className="stat-top"><span>Open complaints</span><div className="icon">📝</div></div><h2>12</h2><p>3 updated today</p></div><div className="card stat"><div className="stat-top"><span>Marketplace items</span><div className="icon">🛒</div></div><h2>18</h2><p>5 added this week</p></div><div className="card stat"><div className="stat-top"><span>Campus notices</span><div className="icon">📢</div></div><h2>4</h2><p>1 updated today</p></div></div>
        <div className="section-title" id="modules"><h2>Campus services</h2><span>Five core modules</span></div>
        <div className="modules">{modules.map(([icon,title,description,href])=><a className="card module module-link" href={href} key={title}><div className="icon">{icon}</div><div><h3>{title}</h3><p>{description}</p></div><div className="arrow">›</div></a>)}</div>
        <div className="activity"><div className="card"><div className="section-title" style={{marginTop:0}}><h2>Recent activity</h2><span>Campus feed</span></div>{activities.map(([title,text,time])=><div className="activity-item" key={title}><div className="dot"/><div><b>{title}</b><p>{text} • {time}</p></div></div>)}</div><div className="card quick"><div className="section-title" style={{marginTop:0}}><h2>Quick actions</h2></div><a className="quick-link" href="/complaints">📝 Create a complaint</a><a className="quick-link" href="/marketplace">🛒 Browse Marketplace</a><a className="quick-link" href="/lost-found">🔎 Post a lost item</a><a className="quick-link" href="/study-hub">📚 Open Study Hub</a></div></div>
      </section>
    </main>
  </div>
}