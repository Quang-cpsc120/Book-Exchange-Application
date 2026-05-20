import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const SUBJECTS = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS = ['Like New','Good','Fair','Worn'];

export default function PostBook({ onPosted }) {
  const [form, setForm] = useState({ title: '', author: '', subject: '', condition: 'Good', description: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [myBooks, setMyBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchMyBooks = useCallback(async () => {
    setBooksLoading(true);
    try {
      const res = await api.get('/books/mine');
      setMyBooks(res.data);
    } catch (e) {} finally { setBooksLoading(false); }
  }, []);

  useEffect(() => { fetchMyBooks(); }, [fetchMyBooks]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    if (!form.title.trim()) { setMsg({ text: 'Book title is required.', ok: false }); return; }
    setLoading(true);
    try {
      await api.post('/books', form);
      setMsg({ text: `"${form.title}" has been listed for exchange!`, ok: true });
      setForm({ title: '', author: '', subject: '', condition: 'Good', description: '' });
      await fetchMyBooks();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error posting book.', ok: false });
    } finally { setLoading(false); }
  };

  const toggleAvailable = async (id, current) => {
    try {
      await api.patch(`/books/${id}`, { available: !current });
      await fetchMyBooks();
    } catch (e) {
      alert('Could not update listing status.');
    }
  };

  const deleteBook = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from your listings?`)) return;
    try {
      await api.delete(`/books/${id}`);
      await fetchMyBooks();
    } catch (e) {
      alert('Could not delete listing.');
    }
  };

  return (
    <div>
      <div style={s.pageTop}>
        <h1 style={s.heading}>Sell / Post a Book</h1>
        <p style={s.subheading}>List a textbook you want to exchange with other students</p>
      </div>

      <div style={s.layout}>
        {/* Post form */}
        <div style={s.formCol}>
          <div className="card">
            <h2 className="section-title">New listing</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label>Book title *</label>
                <input name="title" value={form.title} onChange={handle} placeholder="e.g. Introduction to Algorithms" required />
              </div>
              <div className="field">
                <label>Author</label>
                <input name="author" value={form.author} onChange={handle} placeholder="e.g. Cormen, Leiserson, Rivest" />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Subject</label>
                  <select name="subject" value={form.subject} onChange={handle}>
                    <option value="">Select…</option>
                    {SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Condition</label>
                  <select name="condition" value={form.condition} onChange={handle}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea name="description" value={form.description} onChange={handle} placeholder="Edition, notes, ISBN, any damage…" />
              </div>
              {msg.text && <div className={`alert ${msg.ok ? 'alert-ok' : 'alert-err'}`}>{msg.text}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Posting…' : 'Post Listing'}
                </button>
                {msg.ok && (
                  <button className="btn btn-outline" type="button" onClick={onPosted}>
                    Browse books →
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Condition guide */}
          <div style={s.guide}>
            <div style={s.guideTitle}>Condition guide</div>
            {[
              ['Like New', 'No marks, no damage, may be unread'],
              ['Good',     'Light wear, maybe some highlighting'],
              ['Fair',     'Visible wear, writing, or bent corners'],
              ['Worn',     'Heavy use, torn pages, heavy marking'],
            ].map(([cond, desc]) => (
              <div key={cond} style={s.guideRow}>
                <span className={`badge ${cond === 'Like New' ? 'badge-green' : cond === 'Good' ? 'badge-blue' : cond === 'Fair' ? 'badge-amber' : 'badge-red'}`}>{cond}</span>
                <span style={s.guideDesc}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My listings */}
        <div style={s.listingsCol}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>My listings ({myBooks.length})</h2>
          {booksLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: 'auto' }} />
            </div>
          ) : myBooks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="icon">📦</div>
              <p>No books listed yet. Post your first one!</p>
            </div>
          ) : (
            myBooks.map(book => (
              <div key={book._id} style={s.listingRow}>
                <div style={s.listingIndicator(book.available)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.listingTitle}>{book.title}</div>
                  <div style={s.listingMeta}>
                    {book.author && <span>{book.author}</span>}
                    {book.author && book.subject && <span style={s.dot}>·</span>}
                    {book.subject && <span>{book.subject}</span>}
                  </div>
                  <div style={s.listingBadges}>
                    <span className={`badge ${book.available ? 'badge-green' : 'badge-gray'}`}>
                      {book.available ? 'Available' : 'Exchanged'}
                    </span>
                    <span className="badge badge-gray">{book.condition}</span>
                    <span style={s.viewCount}>👁 {book.views} view{book.views !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={s.listingActions}>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleAvailable(book._id, book.available)}>
                    {book.available ? 'Mark Exchanged' : 'Relist'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteBook(book._id, book.title)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  pageTop: { marginBottom: 28 },
  heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'var(--muted)' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 28,
    alignItems: 'start',
  },
  formCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  listingsCol: {},
  guide: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 18px',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111',
    marginBottom: 12,
  },
  guideRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
    borderBottom: '1px solid var(--border)',
  },
  guideDesc: { fontSize: 12, color: 'var(--muted)' },
  listingRow: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  listingIndicator: (available) => ({
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 4,
    background: available ? 'var(--success)' : '#ccc',
    flexShrink: 0,
    minHeight: 40,
  }),
  listingTitle: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3, lineHeight: 1.35 },
  listingMeta: { fontSize: 12, color: 'var(--muted)', marginBottom: 7, display: 'flex', gap: 4, alignItems: 'center' },
  dot: { color: 'var(--muted2)' },
  listingBadges: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  viewCount: { fontSize: 11, color: 'var(--muted)', marginLeft: 2 },
  listingActions: { display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 },
};
