const modules = [
  ['🚨', 'Campus SOS', 'Send an emergency alert to campus response teams.'],
  ['📝', 'Smart Complaints', 'Report maintenance, facilities, or campus issues.'],
  ['♻️', 'AI WasteVision', 'Identify waste categories and improve segregation.'],
  ['🔎', 'Lost & Found', 'Post and discover lost items around campus.'],
  ['📚', 'Study Hub', 'Access notes, resources, schedules, and study tools.'],
  ['🛡️', 'Admin Dashboard', 'Manage reports, users, alerts, and campus activity.'],
];

const activities = [
  ['New complaint submitted', 'Library — broken study-room light', '8 min ago'],
  ['WasteVision scan completed', 'Canteen — recyclable waste detected', '24 min ago'],
  ['Lost item posted', 'Block B — calculator', '1 hr ago'],
  ['Campus notice updated', 'Tomorrow — seminar hall maintenance', '2 hrs ago'],
];

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SC</div>
          <div><strong>Smart Campus</strong><span>360 • Student Portal</span></div>
        </div>
        <nav className="nav">
          <a className="active" href="#"><span>⌂</span> Dashboard</a>
          <a href="#modules"><span>🚨</span> Campus SOS</a>
          <a href="#modules"><span>📝</span> Complaints</a>
          <a href="#modules"><span>♻️</span> WasteVision</a>
          <a href="#modules"><span>🔎</span> Lost & Found</a>
          <a href="#modules"><span>📚</span> Study Hub</a>
          <a href="#admin"><span>🛡️</span> Admin</a>
        </nav>
        <div className="side-bottom"><b>Smart Campus 360</b><p>A connected campus experience built with free-first tools.</p></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">Campus / <b>Dashboard</b></div>
          <div className="profile"><div><b style={{fontSize: '12px'}}>Student</b><small>Welcome back</small></div><div className="avatar">ST</div></div>
        </header>

        <section className="content">
          <div className="hero">
            <div><h1>Good morning 👋</h1><p>Everything you need to stay connected with your campus.</p></div>
            <div className="date">Saturday, 22 August 2026</div>
          </div>

          <div className="grid">
            <div className="card stat"><div className="stat-top"><span>Open complaints</span><div className="icon">📝</div></div><h2>12</h2><p>3 updated today</p></div>
            <div className="card stat"><div className="stat-top"><span>Active SOS alerts</span><div className="icon">🚨</div></div><h2>0</h2><p>Campus is currently clear</p></div>
            <div className="card stat"><div className="stat-top"><span>Lost items</span><div className="icon">🔎</div></div><h2>7</h2><p>2 new this week</p></div>
          </div>

          <div className="section-title" id="modules"><h2>Campus services</h2><span>Six core modules</span></div>
          <div className="modules">
            {modules.map(([icon, title, description]) => <div className="card module" key={title}><div className="icon">{icon}</div><div><h3>{title}</h3><p>{description}</p></div><div className="arrow">›</div></div>)}
          </div>

          <div className="activity">
            <div className="card"><div className="section-title" style={{marginTop:0}}><h2>Recent activity</h2><span>Live campus feed</span></div>{activities.map(([title, text, time]) => <div className="activity-item" key={title}><div className="dot"/><div><b>{title}</b><p>{text} • {time}</p></div></div>)}</div>
            <div className="card quick" id="admin"><div className="section-title" style={{marginTop:0}}><h2>Quick actions</h2></div><button>🚨 Report an emergency</button><button className="secondary">📝 Create a complaint</button><button className="secondary">🔎 Post a lost item</button></div>
          </div>
        </section>
      </main>
    </div>
  );
}
