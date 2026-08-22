'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Material = { id: string; title: string; description: string | null; subject: string; material_type: string; file_url: string; published_by: string; created_at: string; updated_at: string };

export default function StudyHubPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [editing, setEditing] = useState<Material | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PDF');
  const [fileUrl, setFileUrl] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    setRole((profile?.role ?? 'student') as 'student' | 'staff' | 'admin');
    const { data, error } = await supabase.from('study_materials').select('*').order('created_at', { ascending: false });
    if (error) setMessage(`Study Hub database is not ready: ${error.message}`);
    else setMaterials((data ?? []) as Material[]);
  }

  useEffect(() => { load(); }, []);

  function startEdit(m: Material) {
    setEditing(m); setTitle(m.title); setSubject(m.subject); setDescription(m.description ?? ''); setType(m.material_type); setFileUrl(m.file_url); setMessage('');
  }

  function resetForm() { setEditing(null); setTitle(''); setSubject(''); setDescription(''); setType('PDF'); setFileUrl(''); }

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !['staff', 'admin'].includes(role)) return;
    const payload = { title: title.trim(), subject: subject.trim(), description: description.trim() || null, material_type: type, file_url: fileUrl.trim(), published_by: userData.user.id, updated_at: new Date().toISOString() };
    const result = editing
      ? await supabase.from('study_materials').update({ title: payload.title, subject: payload.subject, description: payload.description, material_type: payload.material_type, file_url: payload.file_url, updated_at: payload.updated_at }).eq('id', editing.id)
      : await supabase.from('study_materials').insert(payload);
    if (result.error) { setMessage(result.error.message); return; }
    resetForm(); await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this study material?')) return;
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) setMessage(error.message); else setMaterials(materials.filter(m => m.id !== id));
  }

  const filtered = materials.filter(m => `${m.title} ${m.subject} ${m.description ?? ''} ${m.material_type}`.toLowerCase().includes(query.toLowerCase()));
  const canManage = role === 'staff' || role === 'admin';

  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Study Hub</h1><p>Students can view and download materials. Staff and admins manage the campus library.</p></div><div className="module-badge">📚</div></header>
    <div className="study-toolbar"><div><b>Study resources</b><span>{canManage ? `Signed in as ${role}` : 'View and download only'}</span></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources..." /></div>
    {canManage && <section className="card form-card" style={{marginBottom:20}}><h2>{editing ? 'Modify study material' : 'Publish study material'}</h2><form onSubmit={save}><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Analog Electronics Unit 1" required /></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Analog Electronics" required /></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" rows={3}/></label><label>Material type<select value={type} onChange={e=>setType(e.target.value)}><option>PDF</option><option>Notes</option><option>Video</option><option>Link</option><option>Other</option></select></label><label>Download / resource link<input type="url" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="https://..." required /></label><div style={{display:'flex',gap:10}}><button className="primary-btn" type="submit">{editing ? 'Save changes' : 'Publish material'}</button>{editing && <button className="secondary-btn" type="button" onClick={resetForm}>Cancel</button>}</div></form></section>}
    <div className="category-grid">{filtered.map(m=><div className="card resource-card" key={m.id}><div className="icon">📘</div><div><h3>{m.title}</h3><p>{m.subject} • {m.description || 'Study material'}</p><span className="resource-type">{m.material_type}</span></div><div style={{display:'flex',gap:8,alignItems:'center'}}><a className="secondary-btn" href={m.file_url} target="_blank" rel="noreferrer">Download</a>{canManage && <><button className="secondary-btn" onClick={()=>startEdit(m)}>Modify</button><button className="danger-btn" onClick={()=>remove(m.id)}>Delete</button></>}</div></div>)}</div>
    {!filtered.length && <div className="card empty-state">No study materials found.</div>}
    {message && <div className="card" style={{marginTop:20}}>{message}</div>}
  </main>;
}
