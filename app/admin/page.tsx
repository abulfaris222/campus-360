'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const initialReports = [
  {id:1,title:'Library study-room light',category:'Electrical',status:'In Progress'},
  {id:2,title:'Water dispenser issue',category:'Facilities',status:'Resolved'},
  {id:3,title:'Canteen waste segregation',category:'Cleanliness',status:'Resolved'},
  {id:4,title:'Wi-Fi access point',category:'Network',status:'Submitted'},
];

export default function AdminPage() {
  const router=useRouter(); const [email,setEmail]=useState(''); const [reports,setReports]=useState(initialReports);
  useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(!data.user) router.replace('/login'); else setEmail(data.user.email??'');});},[router]);
  async function logout(){await supabase.auth.signOut();router.replace('/login');}
  function clearResolved(){setReports(reports.filter(r=>r.status!=='Resolved'));}
  function markResolved(id:number){setReports(reports.map(r=>r.id===id?{...r,status:'Resolved'}:r));}
  const resolved=reports.filter(r=>r.status==='Resolved').length;
  return <main className="module-page admin-dashboard"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Admin Dashboard</h1><p>Manage campus reports and keep the portal organized.</p></div><div className="module-badge">🛡️</div></header>
    <div className="admin-stats"><div className="card"><span>Total reports</span><b>{reports.length}</b></div><div className="card"><span>Open</span><b>{reports.length-resolved}</b></div><div className="card"><span>Resolved</span><b>{resolved}</b></div></div>
    <section className="card"><div className="section-title" style={{marginTop:0}}><div><h2>Complaint management</h2><span>Signed in as {email || 'admin'}</span></div><button className="danger-btn" onClick={clearResolved} disabled={!resolved}>Clear resolved reports</button></div>{reports.map(r=><div className="admin-row" key={r.id}><div><b>{r.title}</b><p>{r.category}</p></div><span className={'status '+r.status.toLowerCase().replaceAll(' ','-')}>{r.status}</span><button className="secondary-btn" onClick={()=>markResolved(r.id)} disabled={r.status==='Resolved'}>{r.status==='Resolved'?'Resolved':'Mark resolved'}</button></div>)}{!reports.length&&<div className="empty-state">No reports remain. New complaints will appear here.</div>}</section>
    <div className="card admin-note"><b>Admin controls</b><p>The report list is demo data for this prototype. Connect these actions to Supabase with admin authorization before college-wide use.</p></div><button className="signout-btn" onClick={logout}>Sign out</button></main>;
}
