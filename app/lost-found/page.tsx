'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Item = {
  id: string;
  item_name: string;
  place: string;
  kind: 'Lost' | 'Found';
  details: string | null;
  status: 'Open' | 'Claimed';
  created_at: string;
  user_id: string;
};

export default function LostFoundPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState<'Lost' | 'Found'>('Lost');
  const [details, setDetails] = useState('');
  const [filter, setFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadItems() {
    const { data, error } = await supabase.from('lost_found_items').select('id,item_name,place,kind,details,status,created_at,user_id').order('created_at', { ascending: false });
    if (error) setMessage(`Could not load posts: ${error.message}`);
    else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  useEffect(() => {
    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await loadItems();
    }
    start();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId || !item.trim() || !place.trim()) return;
    setSaving(true);
    setMessage('');
    const { data, error } = await supabase.from('lost_found_items').insert({ user_id: userId, item_name: item.trim(), place: place.trim(), kind, details: details.trim() || null }).select().single();
    if (error) setMessage(`Could not publish post: ${error.message}`);
    else {
      setItems([data as Item, ...items]);
      setItem(''); setPlace(''); setDetails(''); setKind('Lost');
      setMessage('Post published successfully.');
    }
    setSaving(false);
  }

  async function markClaimed(id: string) {
    const { error } = await supabase.from('lost_found_items').update({ status: 'Claimed' }).eq('id', id).eq('user_id', userId);
    if (error) setMessage(`Could not update post: ${error.message}`);
    else setItems(items.map(x => x.id === id ? { ...x, status: 'Claimed' } : x));
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from('lost_found_items').delete().eq('id', id).eq('user_id', userId);
    if (error) setMessage(`Could not delete post: ${error.message}`);
    else setItems(items.filter(x => x.id !== id));
  }

  const visible = useMemo(() => items.filter(x => (filter === 'All' || x.kind === filter) && `${x.item_name} ${x.place} ${x.details ?? ''}`.toLowerCase().includes(search.toLowerCase())), [items, filter, search]);

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Lost & Found</h1><p>Post lost or found items and help return them to their owners.</p></div><div className="module-badge">🔎</div></header>
    <div className="module-layout"><section className="card form-card"><h2>Post an item</h2><form onSubmit={submit}><label>Item name<input value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Black scientific calculator" required /></label><label>Where was it seen?<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="e.g. Library" required /></label><label>Post type<select value={kind} onChange={e=>setKind(e.target.value as 'Lost' | 'Found')}><option>Lost</option><option>Found</option></select></label><label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Add useful identifying details..." rows={4} /></label><button className="primary-btn" disabled={saving}>{saving ? 'Publishing...' : 'Publish post'}</button></form>{message && <p className="muted" style={{marginTop:12}}>{message}</p>}</section>
    <section className="card"><div className="section-title" style={{marginTop:0}}><h2>Recent posts</h2><span>{visible.length} items</span></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search item or place" /><select value={filter} onChange={e=>setFilter(e.target.value as 'All' | 'Lost' | 'Found')}><option>All</option><option>Lost</option><option>Found</option></select></div>{loading ? <div className="empty-state">Loading posts...</div> : visible.map(x=><div className="report-row" key={x.id}><div><b>{x.kind}: {x.item_name}</b><p>{x.place} • {new Date(x.created_at).toLocaleString('en-IN')}</p>{x.details && <small>{x.details}</small>}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><span className={'status '+(x.status === 'Claimed' ? 'resolved' : 'submitted')}>{x.status}</span>{x.user_id === userId && x.status === 'Open' && <button className="secondary-btn" onClick={()=>markClaimed(x.id)}>Mark claimed</button>}{x.user_id === userId && <button className="secondary-btn" onClick={()=>deletePost(x.id)}>Delete</button>}</div></div>)}{!loading && !visible.length && <div className="empty-state">No matching posts yet.</div>}</section></div></main>;
}
