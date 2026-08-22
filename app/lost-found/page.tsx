'use client';

import { FormEvent, useState } from 'react';

const starter = [
  { id: 1, item: 'Scientific calculator', place: 'Block B', date: 'Today', contact: 'Campus office' },
  { id: 2, item: 'Blue water bottle', place: 'Canteen', date: 'Yesterday', contact: 'Library desk' },
];

export default function LostFoundPage() {
  const [items, setItems] = useState(starter);
  const [item, setItem] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState('Lost');
  function submit(e: FormEvent) { e.preventDefault(); if (!item.trim() || !place.trim()) return; setItems([{id:Date.now(), item:`${kind}: ${item.trim()}`, place:place.trim(), date:'Just now', contact:'Posted by you'}, ...items]); setItem(''); setPlace(''); }
  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Lost & Found</h1><p>Post a lost or found item so the campus community can help reunite it with its owner.</p></div><div className="module-badge">🔎</div></header>
    <div className="module-layout"><section className="card form-card"><h2>Post an item</h2><form onSubmit={submit}><label>Item name<input value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Black calculator" required /></label><label>Where was it seen?<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="e.g. Library" required /></label><label>Post type<select value={kind} onChange={e=>setKind(e.target.value)}><option>Lost</option><option>Found</option></select></label><button className="primary-btn">Publish post</button></form></section>
    <section className="card"><div className="section-title" style={{marginTop:0}}><h2>Recent posts</h2><span>{items.length} items</span></div>{items.map(x=><div className="report-row" key={x.id}><div><b>{x.item}</b><p>{x.place} • {x.date} • {x.contact}</p></div><span className="status submitted">View</span></div>)}</section></div></main>;
}
