import React, { useState } from 'react';
import api from '../utils/api';

const SUBJECTS = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS = ['Like New','Good','Fair','Worn'];

export default function PostBookModal({ open, onClose }) {
  const [form, setForm] = useState({ title: '', author: '', subject: '', condition: 'Good', description: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    setLoading(true);
    try {
      await api.post('/books', form);
      setMsg({ text: `"${form.title}" is now listed!`, ok: true });
      setForm({ title: '', author: '', subject: '', condition: 'Good', description: '' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error posting book.', ok: false });
    } finally {
      setLoading(false); }
  };

  const handleClose = () => { setMsg({ text: '', ok: false }); onClose(); };

  if (!open) return null;

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={modal}>
        <div style={header}>
          <h2 style={heading}>Post a Book</h2>
          <button style={closeBtn} onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14"/></svg>
          </button>
        </div>

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
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
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
            <textarea name="description" value={form.description} onChange={handle} placeholder="Edition, ISBN, notes, any damage…" style={{ minHeight: 72 }} />
          </div>

          {msg.text && <div className={`alert ${msg.ok ? 'alert-ok' : 'alert-err'}`}>{msg.text}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Posting…' : 'Post Listing'}
            </button>
            {msg.ok && <button className="btn btn-outline" type="button" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>Done</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modal   = { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px 28px', maxWidth: 480, width: '100%', boxShadow: 'var(--shadow-lg)', maxHeight: '92vh', overflowY: 'auto' };
const header  = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 };
const heading = { fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.01em' };
const closeBtn = { background: '#f5f5f5', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' };
