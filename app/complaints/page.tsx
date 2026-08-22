'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Complaint = {
  id: string;
  title: string;
  category: string;
  location: string;
  details: string | null;
  status: 'Submitted' | 'In Progress' | 'Resolved';
  created_at: string;
};

const starter: Complaint[] = [
  { id: 'demo-1', title: 'Library study-room light', category: 'Electrical', location: 'Library', details: 'Study-room light needs attention.', status: 'In Progress', created_at: new Date().toISOString() },
  { id: 'demo-2', title: 'Water dispenser issue', category: 'Facilities', location: 'Block B', details: 'Water dispenser is not working.', status: 'Resolved', created_at: new Date().toISOString() },
];

export default function ComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Facilities');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  async function loadComplaints() {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('id,title,category,location,details,status,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setItems(starter);
      setNotice('Run supabase/complaints.sql in Supabase SQL Editor to enable saved complaints.');
    } else {
      setItems((data ?? []) as Complaint[]);
      setNotice('');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice('Please sign in before submitting a complaint.');
      return;
    }

    const { error } = await supabase.from('complaints').insert({
      user_id: user.id,
      title: title.trim(),
      category,
      location: location.trim(),
      details: details.trim() || null,
    });

    if (error) {
      setNotice(`Could not submit complaint: ${error.message}`);
      return;
    }

    setTitle('');
    setLocation('');
    setDetails('');
    setSent(true);
    await loadComplaints();
    window.setTimeout(() => setSent(false), 4000);
  }

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Smart Complaints</h1><p>Report campus maintenance and facility issues and follow their progress.</p></div><div className="module-badge">📝</div></header>
    <div className="module-layout"><section className="card form-card"><h2>Create a complaint</h2><p className="muted">Give the campus team enough detail to act quickly.</p><form onSubmit={submit}>
      <label>Issue title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Fan not working" required /></label>
      <div className="two-col"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Facilities</option><option>Electrical</option><option>Cleanliness</option><option>Network</option><option>Other</option></select></label><label>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Block B" required /></label></div>
      <label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe the issue briefly..." rows={5}/></label>
      <button className="primary-btn" type="submit">Submit complaint</button>{sent && <p className="success-msg">Complaint submitted successfully.</p>}{notice && <p className="muted" style={{marginTop:10}}>{notice}</p>}
    </form></section><section><div className="card"><div className="section-title" style={{marginTop:0}}><h2>My complaints</h2><span>{loading ? 'Loading...' : `${items.length} reports`}</span></div>{items.map(item=><div className="report-row" key={item.id}><div><b>{item.title}</b><p>{item.category} • {item.location}</p><small>{new Date(item.created_at).toLocaleString('en-IN')}</small></div><span className={'status '+item.status.toLowerCase().replaceAll(' ','-')}>{item.status}</span></div>)}{!loading && !items.length && <div className="empty-state">No complaints submitted yet.</div>}</div></section></div></main>;
}
