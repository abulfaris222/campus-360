'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Listing = {
  id: string;
  title: string;
  price: number;
  condition: 'Like new' | 'Good' | 'Used';
  category: string;
  description: string | null;
  seller_id: string;
  created_at: string;
};

const demoItems: Listing[] = [
  { id: 'demo-1', title: 'Scientific Calculator', price: 450, condition: 'Good', category: 'Calculators', description: 'Useful for engineering mathematics.', seller_id: '', created_at: new Date().toISOString() },
  { id: 'demo-2', title: 'Engineering Drawing Kit', price: 300, condition: 'Like new', category: 'Lab & Drawing', description: 'Complete drawing kit.', seller_id: '', created_at: new Date().toISOString() },
  { id: 'demo-3', title: 'Engineering Mathematics Textbook', price: 250, condition: 'Good', category: 'Books', description: 'Good condition textbook.', seller_id: '', created_at: new Date().toISOString() },
  { id: 'demo-4', title: 'College Backpack', price: 500, condition: 'Good', category: 'Bags', description: 'College-use backpack.', seller_id: '', created_at: new Date().toISOString() },
  { id: 'demo-5', title: 'Digital Vernier Caliper', price: 650, condition: 'Good', category: 'Lab & Drawing', description: 'Digital vernier caliper.', seller_id: '', created_at: new Date().toISOString() },
  { id: 'demo-6', title: 'USB Keyboard & Mouse', price: 350, condition: 'Good', category: 'Electronics', description: 'Keyboard and mouse set.', seller_id: '', created_at: new Date().toISOString() },
];

const categories = ['All', 'Calculators', 'Books', 'Lab & Drawing', 'Bags', 'Electronics'];

function itemEmoji(category: string) {
  if (category === 'Books') return '📚';
  if (category === 'Bags') return '🎒';
  if (category === 'Electronics') return '⌨️';
  if (category === 'Lab & Drawing') return '📐';
  return '🧮';
}

export default function Marketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showSell, setShowSell] = useState(false);
  const [showMessage, setShowMessage] = useState<Listing | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', price: '', condition: 'Good' as Listing['condition'], category: 'Calculators', description: '' });

  async function loadListings() {
    setLoading(true);
    const { data, error } = await supabase.from('marketplace_listings').select('id,title,price,condition,category,description,seller_id,created_at').order('created_at', { ascending: false });
    if (error) {
      setItems(demoItems);
      setNotice('Connect the Marketplace database by running supabase/marketplace.sql in Supabase SQL Editor.');
    } else {
      setItems((data ?? []) as Listing[]);
    }
    setLoading(false);
  }

  useEffect(() => { loadListings(); }, []);

  const filtered = useMemo(() => items.filter(item =>
    (category === 'All' || item.category === category) &&
    item.title.toLowerCase().includes(query.toLowerCase())
  ), [items, category, query]);

  async function addItem(event: FormEvent) {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.title.trim() || !price) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice('Please sign in before posting an item.');
      return;
    }

    const { error } = await supabase.from('marketplace_listings').insert({
      seller_id: user.id,
      title: form.title.trim(),
      price,
      condition: form.condition,
      category: form.category,
      description: form.description.trim() || null,
    });

    if (error) {
      setNotice(`Could not post the item: ${error.message}`);
      return;
    }

    setForm({ title: '', price: '', condition: 'Good', category: 'Calculators', description: '' });
    setShowSell(false);
    setNotice('Your item is now saved in the campus marketplace.');
    await loadListings();
    setTimeout(() => setNotice(''), 4000);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!showMessage || !message.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice('Please sign in before contacting a seller.');
      return;
    }
    if (!showMessage.seller_id || showMessage.seller_id === user.id) {
      setNotice('You cannot message yourself or a demo listing.');
      return;
    }

    const { error } = await supabase.from('marketplace_messages').insert({
      listing_id: showMessage.id,
      sender_id: user.id,
      recipient_id: showMessage.seller_id,
      body: message.trim(),
    });

    if (error) {
      setNotice(`Could not send message: ${error.message}`);
      return;
    }
    setMessage('');
    setShowMessage(null);
    setNotice('Message sent securely through your campus account.');
    setTimeout(() => setNotice(''), 4000);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="logo">SC</div><div><strong>Smart Campus</strong><span>360 • Campus Portal</span></div></div>
        <nav className="nav">
          <a href="/"><span>⌂</span> Dashboard</a>
          <a href="/complaints"><span>📝</span> Complaints</a>
          <a className="active" href="/marketplace"><span>🛒</span> Marketplace</a>
          <a href="/lost-found"><span>🔎</span> Lost & Found</a>
          <a href="/study-hub"><span>📚</span> Study Hub</a>
          <a href="/admin"><span>🛡️</span> Admin</a>
          <a href="/login"><span>↪</span> Sign in</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar"><div className="crumb">Campus / <b>Marketplace</b></div><a className="signin-link" href="/login">Sign in <span>→</span></a></header>
        <section className="content">
          <div className="hero"><div><h1>🛒 Campus Marketplace</h1><p>Useful things from seniors to juniors — at student-friendly prices.</p></div><button className="primary" onClick={() => setShowSell(true)}>＋ Sell an item</button></div>
          {notice && <div className="card" style={{ marginBottom: 20, padding: 14 }}>ℹ️ {notice}</div>}

          <div className="card" style={{ padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input aria-label="Search marketplace" placeholder="Search calculators, books, bags..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
              <select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
            </div>
          </div>

          <div className="section-title"><h2>Available items</h2><span>{loading ? 'Loading...' : `${filtered.length} listings`}</span></div>
          <div className="modules">
            {filtered.map(item => (
              <div className="card module" key={item.id}>
                <div className="icon" style={{ fontSize: 34 }}>{itemEmoji(item.category)}</div>
                <div style={{ flex: 1 }}>
                  <h3>{item.title}</h3>
                  <p>{item.condition} • {item.category}</p>
                  <p>{item.description || 'Campus marketplace listing'}</p>
                </div>
                <div style={{ textAlign: 'right' }}><strong style={{ fontSize: 20 }}>₹{Number(item.price).toLocaleString('en-IN')}</strong><br /><button className="quick-link" onClick={() => setShowMessage(item)}>Message seller</button></div>
              </div>
            ))}
          </div>

          {!loading && filtered.length === 0 && <div className="card" style={{ padding: 30, textAlign: 'center' }}>No items found. Try another search or category.</div>}

          {showSell && <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="section-title" style={{ marginTop: 0 }}><h2>Sell an item</h2><button onClick={() => setShowSell(false)}>✕ Close</button></div>
            <form onSubmit={addItem} style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
              <input required placeholder="Item name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input required type="number" min="1" placeholder="Price in ₹" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as Listing['condition'] })}><option>Like new</option><option>Good</option><option>Used</option></select>
              <textarea placeholder="Short description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
              <button className="primary" type="submit">Post item</button>
            </form>
          </div>}

          {showMessage && <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="section-title" style={{ marginTop: 0 }}><h2>Message seller</h2><button onClick={() => setShowMessage(null)}>✕ Close</button></div>
            <p style={{ marginBottom: 12 }}>About: <b>{showMessage.title}</b></p>
            <form onSubmit={sendMessage} style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
              <textarea required maxLength={1000} placeholder="Ask about availability, condition, pickup on campus, etc." value={message} onChange={e => setMessage(e.target.value)} rows={5} />
              <button className="primary" type="submit">Send securely</button>
            </form>
          </div>}
        </section>
      </main>
    </div>
  );
}
