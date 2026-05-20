import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExchangeRequests from '../components/ExchangeRequests';
import ActivityFeed from '../components/ActivityFeed';
import api from '../utils/api';

const DEPARTMENTS = ['Computer Science','Engineering','Mathematics','Physics','Chemistry','Biology','Economics','Literature','History','Other'];
const YEARS       = ['Freshman','Sophomore','Junior','Senior','Graduate'];
const SUBJECTS    = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS  = ['Like New','Good','Fair','Worn'];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(queryTab || 'profile');

  useEffect(() => {
    if (queryTab) setTab(queryTab);
  }, [queryTab]);

  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const TABS = [
    { id: 'profile',  label: 'Profile' },
    { id: 'listings', label: 'My Listings' },
    { id: 'requests', label: 'Requests' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div style={s.page}>
      {/* ── Profile header ── */}
      <div style={s.profileHeader}>
        <div style={s.avatarLg}>{initials(user?.fullName)}</div>
        <div style={s.headerInfo}>
          <h1 style={s.name}>{user?.fullName}</h1>
          <div style={s.metaRow}>
            {user?.studentId  && <span style={s.metaPill}>{user.studentId}</span>}
            {user?.department && <span style={s.metaPill}>{user.department}</span>}
            {user?.year       && <span style={s.metaPill}>{user.year}</span>}
          </div>
          {user?.bio && <p style={s.bio}>{user.bio}</p>}
        </div>
        <div style={s.statsRow}>
          <StatBox value={user?.booksPosted || 0}        label="Books listed" />
          <StatBox value={user?.exchangesCompleted || 0} label="Exchanges" />
          <StatBox value={user?.classes?.length || 0}    label="Classes" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={s.tabContent}>
        {tab === 'profile'  && <ProfileTab user={user} updateProfile={updateProfile} />}
        {tab === 'listings' && <ListingsTab />}
        {tab === 'requests' && <ExchangeRequests />}
        {tab === 'activity' && <ActivityFeed />}
      </div>
    </div>
  );
}

/* ── Profile edit tab ── */
function ProfileTab({ user, updateProfile }) {
  const [form, setForm] = useState({
    fullName:   user?.fullName   || '',
    department: user?.department || '',
    year:       user?.year       || '',
    bio:        user?.bio        || '',
    classes:    user?.classes    || [],
  });
  const [classInput, setClassInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState({ text: '', ok: false });

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const addClass = () => {
    const val = classInput.trim().toUpperCase();
    if (!val || form.classes.includes(val)) return;
    setForm({ ...form, classes: [...form.classes, val] });
    setClassInput('');
  };
  const removeClass = (cls) => setForm({ ...form, classes: form.classes.filter(c => c !== cls) });

  const save = async e => {
    e.preventDefault();
    setSaving(true); setMsg({ text: '', ok: false });
    try {
      await updateProfile(form);
      setMsg({ text: 'Profile updated successfully!', ok: true });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error saving profile.', ok: false });
    } finally { setSaving(false); }
  };

  return (
    <div style={pt.wrap}>
      <div style={pt.formCard}>
        <h2 style={pt.sectionTitle}>Personal information</h2>
        <form onSubmit={save}>
          <div className="form-grid">
            <div className="field full">
              <label>Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handle} placeholder="Jane Smith" />
            </div>
            <div className="field">
              <label>Department / Major</label>
              <select name="department" value={form.department} onChange={handle}>
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Year</label>
              <select name="year" value={form.year} onChange={handle}>
                <option value="">Select…</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Bio <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea name="bio" value={form.bio} onChange={handle} placeholder="Tell other students a bit about yourself…" style={{ minHeight: 72 }} />
            </div>
          </div>

          {/* Classes */}
          <div style={pt.classSection}>
            <div style={pt.classSectionTitle}>
              My classes
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>Used for book recommendations</span>
            </div>
            <div style={pt.classInputRow}>
              <input
                style={pt.classInput}
                value={classInput}
                onChange={e => setClassInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addClass(); } }}
                placeholder="e.g. CPSC 120, MATH 150…"
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={addClass}>Add</button>
            </div>
            {form.classes.length > 0 && (
              <div style={pt.classTags}>
                {form.classes.map(cls => (
                  <div key={cls} style={pt.classTag}>
                    {cls}
                    <button type="button" style={pt.tagX} onClick={() => removeClass(cls)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg.text && <div className={`alert ${msg.ok ? 'alert-ok' : 'alert-err'}`}>{msg.text}</div>}
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Account info (read-only) */}
      <div style={pt.infoCard}>
        <h2 style={pt.sectionTitle}>Account</h2>
        <div style={pt.infoRow}><span style={pt.infoLabel}>Student ID</span><span style={pt.infoValue}>{user?.studentId}</span></div>
        <div style={pt.infoRow}><span style={pt.infoLabel}>Email</span><span style={pt.infoValue}>{user?.email}</span></div>
        <div style={pt.infoRow}><span style={pt.infoLabel}>Member since</span><span style={pt.infoValue}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
      </div>
    </div>
  );
}

/* ── My listings tab ── */
function ListingsTab() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/books/mine'); setBooks(res.data); }
    catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const toggle = async (id, cur) => {
    try { await api.patch(`/books/${id}`, { available: !cur }); await fetchBooks(); }
    catch { alert('Could not update listing.'); }
  };
  const remove = async (id, title) => {
    if (!window.confirm(`Remove "${title}"?`)) return;
    try { await api.delete(`/books/${id}`); await fetchBooks(); }
    catch { alert('Could not delete listing.'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: 'auto' }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>My listings</h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{books.length} book{books.length !== 1 ? 's' : ''}</span>
      </div>
      {books.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div><p>No books listed yet.</p></div>
      ) : books.map(book => (
        <div key={book._id} style={lt.row}>
          <div style={lt.bar(book.available)} />
          <div style={{ flex: 1 }}>
            <div style={lt.title}>{book.title}</div>
            <div style={lt.meta}>{[book.author, book.subject].filter(Boolean).join(' · ')}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${book.available ? 'badge-green' : 'badge-gray'}`}>{book.available ? 'Available' : 'Exchanged'}</span>
              <span className="badge badge-gray">{book.condition}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>👁 {book.views}</span>
            </div>
          </div>
          <div style={lt.actions}>
            <button className="btn btn-outline btn-sm" onClick={() => toggle(book._id, book.available)}>{book.available ? 'Mark Exchanged' : 'Relist'}</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(book._id, book.title)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ value, label }) {
  return (
    <div style={s.statBox}>
      <div style={s.statVal}>{value}</div>
      <div style={s.statLbl}>{label}</div>
    </div>
  );
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  profileHeader: {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '28px 28px', marginBottom: 4,
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
  },
  avatarLg: { width: 68, height: 68, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  headerInfo: { flex: 1 },
  name:  { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 8 },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  metaPill: { fontSize: 12, background: '#f5f5f5', border: '1px solid var(--border)', color: '#555', padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  bio:   { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginTop: 4 },
  statsRow: { display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: '4px', border: '1px solid var(--border)', flexShrink: 0 },
  statBox: { textAlign: 'center', padding: '10px 18px' },
  statVal: { fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' },
  statLbl: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  tabBar: {
    display: 'flex', borderBottom: '1px solid var(--border)',
    background: '#fff', padding: '0 4px', marginBottom: 24,
    borderRadius: '0 0 0 0', overflowX: 'auto',
  },
  tabBtn: {
    padding: '14px 18px', background: 'none', border: 'none',
    borderBottom: '2px solid transparent', fontSize: 14, fontWeight: 500,
    color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'var(--font)', transition: 'var(--transition)',
  },
  tabActive: { color: '#111', borderBottomColor: '#111' },
  tabContent: {},
};

const pt = {
  wrap: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' },
  formCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' },
  infoCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 18, letterSpacing: '-0.01em' },
  classSection: { marginTop: 4, marginBottom: 16 },
  classSectionTitle: { fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 },
  classInputRow: { display: 'flex', gap: 8, marginBottom: 10 },
  classInput: { flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' },
  classTags: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  classTag: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 10px 4px 12px', borderRadius: 20 },
  tagX: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', fontFamily: 'var(--font)' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  infoLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 600 },
  infoValue: { fontSize: 13, color: '#111', fontWeight: 500 },
};

const lt = {
  row: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' },
  bar: (av) => ({ width: 4, alignSelf: 'stretch', borderRadius: 4, background: av ? 'var(--success)' : '#ccc', flexShrink: 0, minHeight: 48 }),
  title:   { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 },
  meta:    { fontSize: 12, color: 'var(--muted)' },
  actions: { display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 },
};
