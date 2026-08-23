'use client';

import { DragEvent, FormEvent, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Material = { id: string; title: string; description: string | null; subject: string; material_type: string; file_url: string; published_by: string; created_at: string; updated_at: string };

const ACCEPTED_FILES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function typeFromFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx', 'txt'].includes(ext)) return 'Notes';
  if (['ppt', 'pptx'].includes(ext)) return 'Other';
  return 'Other';
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
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

  function validateFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setMessage('File is too large. Maximum size is 50 MB.');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'webp', 'zip'];
    if (!allowed.includes(ext)) {
      setMessage('Unsupported file type. Use PDF, Word, PowerPoint, Excel, images, TXT, CSV or ZIP.');
      return false;
    }
    return true;
  }

  function chooseFile(file: File | null) {
    if (!file) return;
    if (!validateFile(file)) return;
    setSelectedFile(file);
    setType(typeFromFile(file));
    setMessage('');
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0] ?? null);
  }

  function startEdit(m: Material) {
    setEditing(m); setTitle(m.title); setSubject(m.subject); setDescription(m.description ?? ''); setType(m.material_type); setFileUrl(m.file_url); setSelectedFile(null); setMessage('');
  }

  function resetForm() { setEditing(null); setTitle(''); setSubject(''); setDescription(''); setType('PDF'); setFileUrl(''); setSelectedFile(null); setDragging(false); }

  async function uploadFile(file: File, userId: string) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 120);
    const path = `${userId}/${crypto.randomUUID()}-${safeName || `study-file.${ext}`}`;
    const { error } = await supabase.storage.from('study-materials').upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw new Error(`File upload failed: ${error.message}`);
    const { data } = supabase.storage.from('study-materials').getPublicUrl(path);
    return data.publicUrl;
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!title.trim() || !subject.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user || !['staff', 'admin'].includes(role)) return;
    setSaving(true);
    try {
      let finalFileUrl = fileUrl.trim();
      if (selectedFile) finalFileUrl = await uploadFile(selectedFile, user.id);
      if (!finalFileUrl) throw new Error('Please upload a file or provide a resource link.');
      const payload = { title: title.trim(), subject: subject.trim(), description: description.trim() || null, material_type: type, file_url: finalFileUrl, published_by: user.id, updated_at: new Date().toISOString() };
      const result = editing
        ? await supabase.from('study_materials').update({ title: payload.title, subject: payload.subject, description: payload.description, material_type: payload.material_type, file_url: payload.file_url, updated_at: payload.updated_at }).eq('id', editing.id)
        : await supabase.from('study_materials').insert(payload);
      if (result.error) throw new Error(result.error.message);
      resetForm(); await load(); setMessage(editing ? 'Study material updated successfully.' : 'Study material uploaded successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save study material.');
    } finally {
      setSaving(false);
    }
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
    {canManage && <section className="card form-card" style={{marginBottom:20}}><h2>{editing ? 'Modify study material' : 'Upload study material'}</h2><form onSubmit={save}><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Analog Electronics Unit 1" required /></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Analog Electronics" required /></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" rows={3}/></label><label>Material type<select value={type} onChange={e=>setType(e.target.value)}><option>PDF</option><option>Notes</option><option>Video</option><option>Link</option><option>Other</option></select></label>
      <div onDragEnter={e=>{e.preventDefault();setDragging(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={e=>{e.preventDefault();setDragging(false)}} onDrop={handleDrop} style={{border:dragging?'2px solid #2563eb':'2px dashed rgba(0,0,0,.18)',borderRadius:16,padding:24,textAlign:'center',background:dragging?'rgba(37,99,235,.06)':'rgba(0,0,0,.02)',transition:'all .2s',marginTop:8}}>
        <div style={{fontSize:30,marginBottom:8}}>📁</div><b>{dragging ? 'Drop your file here' : 'Drag & drop your file here'}</b><p style={{margin:'7px 0',opacity:.7}}>or choose a file from your computer</p><input id="study-file" type="file" accept={ACCEPTED_FILES} onChange={e=>chooseFile(e.target.files?.[0] ?? null)} style={{display:'none'}} /><label htmlFor="study-file" className="secondary-btn" style={{display:'inline-block',cursor:'pointer'}}>Choose file</label>{selectedFile && <p style={{margin:'12px 0 0',fontWeight:600}}>📄 {selectedFile.name} <span style={{fontWeight:400,opacity:.7}}>({(selectedFile.size/1024/1024).toFixed(2)} MB)</span></p>}<small style={{display:'block',marginTop:8,opacity:.65}}>PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, CSV, images or ZIP • max 50 MB</small>
      </div>
      <label>Or use an external resource link <input type="url" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="https://..." /></label><small style={{opacity:.65}}>Uploading a file is recommended. A link can still be used for videos or online resources.</small><div style={{display:'flex',gap:10,marginTop:12}}><button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Uploading...' : editing ? 'Save changes' : 'Upload & publish'}</button>{editing && <button className="secondary-btn" type="button" onClick={resetForm}>Cancel</button>}</div></form></section>}
    <div className="category-grid">{filtered.map(m=><div className="card resource-card" key={m.id}><div className="icon">📘</div><div><h3>{m.title}</h3><p>{m.subject} • {m.description || 'Study material'}</p><span className="resource-type">{m.material_type}</span></div><div style={{display:'flex',gap:8,alignItems:'center'}}><a className="secondary-btn" href={m.file_url} target="_blank" rel="noreferrer">View</a><a className="secondary-btn" href={m.file_url} target="_blank" rel="noreferrer" download>Download</a>{canManage && <><button className="secondary-btn" onClick={()=>startEdit(m)}>Modify</button><button className="danger-btn" onClick={()=>remove(m.id)}>Delete</button></>}</div></div>)}</div>
    {!filtered.length && <div className="card empty-state">No study materials found.</div>}
    {message && <div className="card" style={{marginTop:20}}>{message}</div>}
  </main>;
}
