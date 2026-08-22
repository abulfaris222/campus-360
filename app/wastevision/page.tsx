'use client';

import { useState } from 'react';

const types = [
  ['♻️', 'Recyclable', 'Paper, cardboard, clean plastic and metal'],
  ['🍃', 'Organic', 'Food scraps and other compostable waste'],
  ['🗑️', 'General', 'Non-recyclable everyday waste'],
  ['⚠️', 'Special', 'Electronic or other items needing separate handling'],
];

export default function WasteVisionPage() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  function scan() {
    setResult('Recyclable — confidence 94%');
  }
  return <main className="module-page"><header className="module-header"><div><a className="back" href="/">← Dashboard</a><h1>AI WasteVision</h1><p>Use a simple visual scan workflow to identify the right waste category.</p></div><div className="module-badge">♻️</div></header>
    <div className="card scanner-card"><div className="scanner-box"><div className="scan-icon">♻️</div><h2>Waste scanner</h2><p>Choose an image of the waste item, then run the demo classification.</p><input id="waste-file" type="file" accept="image/*" onChange={e=>setFileName(e.target.files?.[0]?.name || '')}/><label className="upload-btn" htmlFor="waste-file">Choose image</label>{fileName && <p className="file-name">{fileName}</p>}<button className="primary-btn" onClick={scan}>Run AI scan</button>{result && <div className="scan-result"><span>AI result</span><b>{result}</b><small>Demo classification — connect a vision model later for live predictions.</small></div>}</div></div>
    <div className="section-title"><h2>Waste categories</h2><span>Quick reference</span></div><div className="category-grid">{types.map(([icon,title,desc])=><div className="card category-card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p></div>)}</div></main>;
}
