'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Item = {
  id: string;
  item_name: string;
  place: string;
  kind: 'Lost' | 'Found';
  details: string | null;
  photo_url: string | null;
  status: 'Open' | 'Returned';
  created_at: string;
  updated_at: string;
  user_id: string;
};

type LFMessage = { id: string; item_id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null; item?: { item_name: string } | null };
type LFMessageRow = Omit<LFMessage, 'item'> & { item: { item_name: string }[] | { item_name: string } | null };

export default function LostFoundPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState<'Lost' | 'Found'>('Lost');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [filter, setFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Returned'>('All');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [posterRegisters, setPosterRegisters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [contactItem, setContactItem] = useState<Item | null>(null);
  const [contactText, setContactText] = useState('');
  const [messages, setMessages] = useState<LFMessage[]>([]);
  const [showInbox, setShowInbox] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  async function loadItems() {
    const { data, error } = await supabase.from('lost_found_items').select('id,item_name,place,kind,details,photo_url,status,created_at,updated_at,user_id').order('created_at', { ascending: false });
    if (error) setMessage(`Could not load posts: ${error.message}`); else setItems((data ?? []) as Item[]);
    setLoading(false);
  }

  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('lost_found_messages').select('id,item_id,sender_id,recipient_id,body,created_at,read_at,item:lost_found_items(item_name)').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', { ascending: false });
    const normalizedMessages: LFMessage[] = ((data ?? []) as LFMessageRow[]).map((row) => ({
      ...row,
      item: Array.isArray(row.item) ? row.item[0] ?? null : row.item,
    }));
    setMessages(normalizedMessages);
  }

  useEffect(() => {
    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const currentRole = (profile?.role ?? 'student') as 'student' | 'staff' | 'admin';
        setRole(currentRole);
        if (currentRole === 'staff' || currentRole === 'admin') {
          const { data: profiles } = await supabase.from('profiles').select('id,register_number');
          const map: Record<string, string> = {};
          (profiles ?? []).forEach((p: { id: string; register_number: string }) => { map[p.id] = p.register_number; });
          setPosterRegisters(map);
        }
      }
      await loadItems(); await loadMessages();
    }
    start();
  }, []);

  function resetForm() { setEditing(null); setItem(''); setPlace(''); setDetails(''); setKind('Lost'); setPhoto(null); }

  async function uploadPhoto(file: File) {
    if (!userId) return null;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setMessage('Please choose an image up to 5 MB.'); return null; }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('lost-found').upload(path, file, { upsert: false });
    if (error) { setMessage(`Photo upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('lost-found').getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId || !item.trim() || !place.trim()) return;
    setSaving(true); setMessage('');
    let photoUrl = editing?.photo_url ?? null;
    if (photo) photoUrl = await uploadPhoto(photo);
    if (photo && !photoUrl) { setSaving(false); return; }
    const payload = { item_name: item.trim(), place: place.trim(), kind, details: details.trim() || null, photo_url: photoUrl, updated_at: new Date().toISOString() };
    const result = editing
      ? await supabase.from('lost_found_items').update(payload).eq('id', editing.id).eq('user_id', userId).select().single()
      : await supabase.from('lost_found_items').insert({ ...payload, user_id: userId, status: 'Open' }).select().single();
    if (result.error) setMessage(`Could not save post: ${result.error.message}`);
    else { resetForm(); await loadItems(); setMessage(editing ? 'Post updated successfully.' : 'Post published successfully.'); }
    setSaving(false);
  }

  async function setReturned(id: string, status: 'Open' | 'Returned') {
    const { error } = await supabase.from('lost_found_items').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    if (error) setMessage(`Could not update post: ${error.message}`); else setItems(items.map(x => x.id === id ? { ...x, status } : x));
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this Lost & Found post?')) return;
    const { error } = await supabase.from('lost_found_items').delete().eq('id', id).eq('user_id', userId);
    if (error) setMessage(`Could not delete post: ${error.message}`); else setItems(items.filter(x => x.id !== id));
  }

  async function sendContact(e: FormEvent) {
    e.preventDefault(); if (!contactItem || !contactText.trim()) return;
    const { error } = await supabase.from('lost_found_messages').insert({ item_id: contactItem.id, sender_id: userId, recipient_id: contactItem.user_id, body: contactText.trim() });
    if (error) setMessage(`Could not send message: ${error.message}`); else { setContactText(''); setContactItem(null); setMessage('Message sent securely to the post owner.'); await loadMessages(); }
  }

  async function replyToMessage(m: LFMessage) {
    if (!replyText.trim()) return;
    const { error } = await supabase.from('lost_found_messages').insert({ item_id: m.item_id, sender_id: userId, recipient_id: m.sender_id === userId ? m.recipient_id : m.sender_id, body: replyText.trim() });
    if (error) setMessage(`Could not send reply: ${error.message}`);
    else {
      setReplyText('');
      setReplyFor(null);
      setMessage('Reply sent securely.');
      await loadMessages();
    }
  }

  async function markRead(id: string) {
    await supabase.from('lost_found_messages').update({ read_at: new Date().toISOString() }).eq('id', id).eq('recipient_id', userId);
    await loadMessages();
  }

  function startEdit(x: Item) { setEditing(x); setItem(x.item_name); setPlace(x.place); setKind(x.kind); setDetails(x.details ?? ''); setPhoto(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  const visible = useMemo(() => items.filter(x => (filter === 'All' || x.kind === filter) && (statusFilter === 'All' || x.status === statusFilter) && `${x.item_name} ${x.place} ${x.details ?? ''}`.toLowerCase().includes(search.toLowerCase())), [items, filter, statusFilter, search]);
  const unread = messages.filter(m => m.recipient_id === userId && !m.read_at).length;

  const controlStyle: React.CSSProperties = { height: 46, border: '1px solid #d9e2ef', borderRadius: 12, padding: '0 14px', outline: 'none', background: '#fff', color: '#26364c', boxShadow: '0 4px 14px rgba(23,42,70,.04)', transition: 'border-color .2s, box-shadow .2s' };
  const selectStyle: React.CSSProperties = { ...controlStyle, minWidth: 125, cursor: 'pointer' };

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:12,background:'#fff',border:'1px solid #dfe7f1',boxShadow:'0 5px 16px rgba(23,42,70,.06)',fontSize:12,fontWeight:800,transition:'all .2s'}}>← <span>Dashboard</span></a><h1>Lost & Found</h1><p>Post lost or found items and help return them to their owners.</p></div><div className="module-badge">🔎</div></header>
    <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginBottom:16}}><button className="secondary-btn" onClick={()=>setShowInbox(!showInbox)}>💬 Messages {unread > 0 && `(${unread})`}</button></div>
    <div className="module-layout"><section className="card form-card"><h2>{editing ? 'Edit post' : 'Post an item'}</h2><form onSubmit={submit}><label>Item name<input value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Black scientific calculator" required /></label><label>Where was it seen?<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="e.g. Library" required /></label><label>Post type<select value={kind} onChange={e=>setKind(e.target.value as 'Lost' | 'Found')}><option>Lost</option><option>Found</option></select></label><label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Add useful identifying details..." rows={4} /></label><label>Photo <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0] ?? null)} /><small>Optional • JPG/PNG/WebP • max 5 MB</small></label><div style={{display:'flex',gap:8}}><button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Publish post'}</button>{editing && <button className="secondary-btn" type="button" onClick={resetForm}>Cancel</button>}</div></form>{message && <p className="muted" style={{marginTop:12}}>{message}</p>}</section>
    <section className="card"><div className="section-title" style={{marginTop:0}}><h2>Recent posts</h2><span>{visible.length} items</span></div><div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18,background:'#f7faff',border:'1px solid #e5ecf5',borderRadius:14,padding:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔎  Search item or place" style={{...controlStyle,flex:'1 1 240px',minWidth:0}} /><select value={filter} onChange={e=>setFilter(e.target.value as 'All' | 'Lost' | 'Found')} style={selectStyle}><option>All</option><option>Lost</option><option>Found</option></select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as 'All' | 'Open' | 'Returned')} style={selectStyle}><option>All</option><option>Open</option><option>Returned</option></select></div>{loading ? <div className="empty-state">Loading posts...</div> : visible.map(x=><div className="report-row" key={x.id}><div style={{display:'flex',gap:14,alignItems:'center'}}>{x.photo_url ? <img src={x.photo_url} alt="" style={{width:72,height:72,objectFit:'cover',borderRadius:12}} /> : <div style={{width:72,height:72,borderRadius:12,display:'grid',placeItems:'center',background:'rgba(0,0,0,.05)',fontSize:28}}>🔎</div>}<div><b>{x.kind}: {x.item_name}</b><p>{x.place} • {new Date(x.created_at).toLocaleString('en-IN')}</p>{(role === 'staff' || role === 'admin') && posterRegisters[x.user_id] && <p style={{ margin: '4px 0', fontWeight: 800, color: '#315b8a' }}>👤 Posted by: {posterRegisters[x.user_id]}</p>}{x.details && <small>{x.details}</small>}</div></div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}><span className={'status '+(x.status === 'Returned' ? 'resolved' : 'submitted')}>{x.status}</span>{x.user_id === userId ? <>{x.status === 'Open' && <button className="secondary-btn" onClick={()=>setReturned(x.id,'Returned')}>Mark returned</button>}{x.status === 'Returned' && <button className="secondary-btn" onClick={()=>setReturned(x.id,'Open')}>Reopen</button>}<button className="secondary-btn" onClick={()=>startEdit(x)}>Edit</button><button className="secondary-btn" onClick={()=>deletePost(x.id)}>Delete</button></> : x.status === 'Open' && <button className="secondary-btn" onClick={()=>setContactItem(x)}>Contact poster</button>}</div></div>)}{!loading && !visible.length && <div className="empty-state">No matching posts yet.</div>}</section></div>
    {contactItem && <section className="card" style={{marginTop:20,padding:22}}><div className="section-title" style={{marginTop:0}}><h2>Contact poster</h2><button onClick={()=>setContactItem(null)}>✕ Close</button></div><p>About: <b>{contactItem.item_name}</b></p><form onSubmit={sendContact} style={{display:'grid',gap:10,maxWidth:650}}><textarea required maxLength={1000} rows={4} value={contactText} onChange={e=>setContactText(e.target.value)} placeholder="Share useful information about this item..." /><button className="primary-btn">Send message</button></form></section>}
    {showInbox && <section className="card" style={{marginTop:20,padding:22}}><div className="section-title" style={{marginTop:0}}><h2>💬 Messages</h2><button onClick={()=>setShowInbox(false)}>✕ Close</button></div>{messages.length === 0 ? <div className="empty-state">No messages yet.</div> : <div style={{display:'grid',gap:10}}>{messages.map(m=><div key={m.id} className="card" style={{padding:14,border:m.recipient_id===userId&&!m.read_at?'2px solid #2563eb':undefined}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div><b>{m.item?.item_name || 'Lost & Found item'}</b><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString('en-IN')}</small></div><div style={{display:'grid',gap:6,justifyItems:'end'}}><button className="quick-link" onClick={()=>{setReplyFor(replyFor===m.id?null:m.id);setReplyText('');}}>↩️ Reply</button>{m.recipient_id===userId&&!m.read_at&&<button className="quick-link" onClick={()=>markRead(m.id)}>Mark as read</button>}</div></div>{replyFor===m.id&&<form onSubmit={(e)=>{e.preventDefault();replyToMessage(m);}} style={{display:'grid',gap:8,marginTop:12}}><textarea required maxLength={1000} rows={3} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write your reply..." /><button className="primary-btn" type="submit">Send reply</button></form>}</div>)}</div>}</section>}
  </main>;
}
