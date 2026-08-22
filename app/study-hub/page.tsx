'use client';

import { useState } from 'react';

const resources = [
  ['📘', 'Engineering Mathematics', 'Formula sheet + revision notes', 'PDF'],
  ['⚡', 'Analog Electronics', 'Unit-wise quick revision', 'Notes'],
  ['🧪', 'Engineering Chemistry', 'Important reactions and concepts', 'Notes'],
  ['💻', 'Python Programming', 'Practice programs and examples', 'Code'],
];

export default function StudyHubPage() {
  const [query, setQuery] = useState('');
  const filtered = resources.filter(r => r.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>Study Hub</h1><p>Keep notes, revision material and useful study resources in one place.</p></div><div className="module-badge">📚</div></header>
    <div className="study-toolbar"><div><b>Study resources</b><span>Search your campus library</span></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources..." /></div>
    <div className="category-grid">{filtered.map(([icon,title,desc,type])=><div className="card resource-card" key={title}><div className="icon">{icon}</div><div><h3>{title}</h3><p>{desc}</p><span className="resource-type">{type}</span></div><button className="secondary-btn">Open</button></div>)}</div>
    <div className="card study-tip"><b>Study tip</b><p>Use the hub to keep your revision material organized by subject and unit. The current resources are demo entries ready to be replaced with your college files.</p></div></main>;
}
