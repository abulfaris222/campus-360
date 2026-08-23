'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Complaint['status']>('All');

  async function loadComplaints(currentRole = role) {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('id,title,category,location,details,status,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setItems(currentRole === 'student' ? starter : []);
      setNotice('Run supabase/complaints.sql in Supabase SQL Editor to enable saved complaints.');
    } else {
      setItems((data ?? []) as Complaint[]);
      setNotice('');
    }
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const currentRole = (profile?.role ?? 'student') as 'student' | 'staff' | 'admin';
        setRole(currentRole);
        await loadComplaints(currentRole);
      } else {
        await loadComplaints('student');
      }
    }
    init();
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
    await loadComplaints(role);
    window.setTimeout(() => setSent(false), 4000);
  }

  async function updateStatus(id: string, status: Complaint['status']) {
    const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
    if (error) {
      setNotice(`Could not update complaint: ${error.message}`);
      return;
    }
    setItems(current => current.map(item => item.id === id ? { ...item, status } : item));
  }

  const canManage = role === 'staff' || role === 'admin';
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesSearch = !query || [item.title, item.category, item.location, item.details ?? ''].some(value => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:12,background:'#fff',border:'1px solid #dfe7f1',boxShadow:'0 5px 16px rgba(23,42,70,.06)',fontSize:12,fontWeight:800,transition:'all .2s'}}>← <span>Dashboard</span></a><h1>Smart Complaints</h1><p>Report campus maintenance and facility issues and follow their progress.</p></div><div className="module-badge">📝</div></header>
    <div className="module-layout"><section className="card form-card"><h2>Create a complaint</h2><p className="muted">Give the campus team enough detail to act quickly.</p><form className="complaint-form" onSubmit={submit}>
      <label>Issue title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Fan not working" required /></label>
      <div className="two-col"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Facilities</option><option>Electrical</option><option>Cleanliness</option><option>Network</option><option>Other</option></select></label><label>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Block B" required /></label></div>
      <label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe the issue briefly..." rows={5}/></label>
      <button className="primary-btn" type="submit">Submit complaint</button>{sent && <p className="success-msg">Complaint submitted successfully.</p>}{notice && <p className="muted" style={{marginTop:10}}>{notice}</p>}
    </form></section><section><div className="card"><div className="section-title" style={{marginTop:0}}><div><h2>{canManage ? 'Campus complaints' : 'My complaints'}</h2>{canManage && <span>{role === 'staff' ? 'Staff can review every complaint and update its status.' : 'Admin can review every complaint and update its status.'}</span>}</div><span>{loading ? 'Loading...' : `${visibleItems.length} of ${items.length} reports`}</span></div>{canManage && <div className="complaint-tools"><div className="complaint-search">🔎<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search complaints..." /></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}><option>All</option><option>Submitted</option><option>In Progress</option><option>Resolved</option></select></div>}{visibleItems.map(item=><div className="report-row" key={item.id}><div><b>{item.title}</b><p>{item.category} • {item.location}</p>{item.details && <p className="muted">{item.details}</p>}<small>{new Date(item.created_at).toLocaleString('en-IN')}</small></div><span className={'status '+item.status.toLowerCase().replaceAll(' ','-')}>{item.status}</span>{canManage && <select className="status-control" value={item.status} onChange={e=>updateStatus(item.id, e.target.value as Complaint['status']}><option>Submitted</option><option>In Progress</option><option>Resolved</option></select>}</div>)}{!loading && !visibleItems.length && <div className="empty-state">{items.length ? 'No complaints match your filters.' : 'No complaints yet.'}</div>}</div></section></div>
    <style jsx>{`
      .complaint-tools{display:flex;gap:10px;align-items:center;margin:-4px 0 14px;padding:10px;border:1px solid #dce7f5;background:#f6f9ff;border-radius:14px}
      .complaint-tools select,.status-control{border:1px solid #c9d9ee;background:#fff;border-radius:10px;padding:10px 12px;font-weight:700;color:#20334f}
      .complaint-search{display:flex;align-items:center;gap:8px;flex:1;border:1px solid #c9d9ee;background:#fff;border-radius:10px;padding:0 11px;color:#52709a}
      .complaint-search input{border:0!important;outline:0!important;box-shadow:none!important;width:100%;min-height:40px;background:transparent}
      .status-control{min-width:128px}
      @media(max-width:760px){.complaint-tools{flex-direction:column;align-items:stretch}.complaint-tools select{width:100%}.status-control{width:100%;margin-top:8px}.report-row{display:block}}
    `}</style></main>;
}
