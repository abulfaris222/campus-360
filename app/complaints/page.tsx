'use client';

import { FormEvent, useState } from 'react';

const starter = [
  { id: 1, title: 'Library study-room light', category: 'Electrical', location: 'Library', status: 'In Progress' },
  { id: 2, title: 'Water dispenser issue', category: 'Facilities', location: 'Block B', status: 'Resolved' },
];

export default function ComplaintsPage() {
  const [items, setItems] = useState(starter);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Facilities');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;
    setItems([{ id: Date.now(), title: title.trim(), category, location: location.trim(), status: 'Submitted' }, ...items]);
    setTitle(''); setLocation(''); setDetails(''); setSent(true);
  }

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Smart Complaints</h1><p>Report campus maintenance and facility issues and follow their progress.</p></div><div className="module-badge">📝</div></header>
    <div className="module-layout"><section className="card form-card"><h2>Create a complaint</h2><p className="muted">Give the campus team enough detail to act quickly.</p><form onSubmit={submit}>
      <label>Issue title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Fan not working" required /></label>
      <div className="two-col"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Facilities</option><option>Electrical</option><option>Cleanliness</option><option>Network</option><option>Other</option></select></label><label>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Block B" required /></label></div>
      <label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe the issue briefly..." rows={5}/></label>
      <button className="primary-btn" type="submit">Submit complaint</button>{sent && <p className="success-msg">Complaint submitted successfully.</p>}
    </form></section><section><div className="card"><div className="section-title" style={{marginTop:0}}><h2>My complaints</h2><span>{items.length} reports</span></div>{items.map(item=><div className="report-row" key={item.id}><div><b>{item.title}</b><p>{item.category} • {item.location}</p></div><span className={'status '+item.status.toLowerCase().replaceAll(' ','-')}>{item.status}</span></div>)}</div></section></div></main>;
}
