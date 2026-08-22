'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type Report = { id: string; title: string; category: string; location: string; details: string | null; status: 'Submitted' | 'In Progress' | 'Resolved'; created_at: string };

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadReports() {
    const { data, error } = await supabase.from('complaints').select('id,title,category,location,details,status,created_at').order('created_at', { ascending: false });
    if (error) setMessage(`Could not load complaints: ${error.message}`);
    else setReports((data ?? []) as Report[]);
    setLoading(false);
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? '');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'admin') { router.replace('/'); return; }
      await loadReports();
    }
    checkAdmin();
  }, [router]);

  async function updateStatus(id: string, status: Report['status']) {
    const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
    if (error) setMessage(`Could not update complaint: ${error.message}`);
    else setReports(reports.map(r => r.id === id ? { ...r, status } : r));
  }

  async function clearResolved() {
    const resolvedIds = reports.filter(r => r.status === 'Resolved').map(r => r.id);
    if (!resolvedIds.length) return;
    const { error } = await supabase.from('complaints').delete().in('id', resolvedIds);
    if (error) setMessage(`Could not clear resolved reports: ${error.message}`);
    else setReports(reports.filter(r => r.status !== 'Resolved'));
  }

  async function logout() {
    sessionStorage.removeItem('smart-campus-360-logged-in');
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const resolved = reports.filter(r => r.status === 'Resolved').length;
  const open = reports.length - resolved;

  return <main className="module-page admin-dashboard"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Admin Dashboard</h1><p>Manage real campus complaints and keep the portal organized.</p></div><div className="module-badge">🛡️</div></header>
    <div className="admin-stats"><div className="card"><span>Total reports</span><b>{reports.length}</b></div><div className="card"><span>Open</span><b>{open}</b></div><div className="card"><span>Resolved</span><b>{resolved}</b></div></div>
    <section className="card"><div className="section-title" style={{marginTop:0}}><div><h2>Complaint management</h2><span>Signed in as {email || 'admin'}</span></div><button className="danger-btn" onClick={clearResolved} disabled={!resolved}>Clear resolved reports</button></div>
      {loading ? <div className="empty-state">Loading complaints...</div> : reports.map(r=><div className="admin-row" key={r.id}><div><b>{r.title}</b><p>{r.category} • {r.location}</p><small>{new Date(r.created_at).toLocaleString('en-IN')}</small></div><span className={'status '+r.status.toLowerCase().replaceAll(' ','-')}>{r.status}</span><select value={r.status} onChange={e=>updateStatus(r.id, e.target.value as Report['status'])}><option>Submitted</option><option>In Progress</option><option>Resolved</option></select></div>)}{!loading && !reports.length&&<div className="empty-state">No complaints yet.</div>}{message && <p className="muted" style={{marginTop:12}}>{message}</p>}</section>
    <div className="card admin-note"><b>Admin controls</b><p>Only users whose profile role is set to <b>admin</b> can open this dashboard and manage complaints.</p></div><button className="signout-btn" onClick={logout}>Sign out</button></main>;
}
