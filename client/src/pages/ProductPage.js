import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import api from '../utils/api';

const SUBJECTS   = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS = ['Like New','Good','Fair','Worn'];
const SORTS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'condition', label: 'Best condition' },
];

export default function ProductPage() {
  const location = useLocation();

  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subject, setSubject]       = useState('');
  const [condition, setCondition]   = useState('');
  const [sort, setSort]             = useState('newest');
  const [selected, setSelected]     = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [savedMsg, setSavedMsg]     = useState('');

  // Pre-populate filters from URL params (e.g. from watchlist "Browse" link)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('q'))       { setSearch(p.get('q')); setDebouncedSearch(p.get('q')); }
    if (p.get('subject')) setSubject(p.get('subject'));
  }, []);

  // 400ms debounce on search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (debouncedSearch) params.q         = debouncedSearch;
      if (subject)         params.subject   = subject;
      if (condition)       params.condition = condition;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subject, condition, sort]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const clearAll = () => {
    setSearch(''); setDebouncedSearch('');
    setSubject(''); setCondition(''); setSort('newest');
  };

  const hasFilters = !!(search || subject || condition || sort !== 'newest');

  const saveSearch = async () => {
    if (!hasFilters) return;
    try {
      await api.post('/watchlist', { keywords: search, subject });
      setSavedMsg('Search saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('Could not save.');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const openBook = (book, i) => { setSelected(book); setSelectedIdx(i); };

  return (
    <div style={s.page}>
      {/* ── Page heading (full width) ── */}
      <div style={s.pageTop}>
        <div>
          <h1 style={s.heading}>Browse Books</h1>
          <p style={s.sub}>Find textbooks available for exchange from fellow Titans</p>
        </div>
        {!loading && (
          <span style={s.count}>{books.length} listing{books.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={s.contentRow}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sideCard}>
          <div style={s.sideHeader}>
            <span style={s.sideTitle}>Filters</span>
            {hasFilters && (
              <button style={s.clearBtn} onClick={clearAll}>Clear all</button>
            )}
          </div>

          {/* Search */}
          <div style={s.sideSection}>
            <label style={s.sideLabel}>Search</label>
            <div style={s.searchWrap}>
              <svg style={s.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3" strokeLinecap="round"/>
              </svg>
              <input
                style={s.searchInput}
                placeholder="Title, author, subject…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={s.clearX} onClick={() => setSearch('')}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Subject */}
          <div style={s.sideSection}>
            <label style={s.sideLabel}>Subject</label>
            <select style={s.filterSelect} value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              {SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div style={s.sideSection}>
            <label style={s.sideLabel}>Condition</label>
            <select style={s.filterSelect} value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="">Any condition</option>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div style={s.sideSection}>
            <label style={s.sideLabel}>Sort by</label>
            <select style={s.filterSelect} value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Active chips */}
          {(subject || condition) && (
            <div style={s.chips}>
              {subject   && <Chip label={subject}   onRemove={() => setSubject('')} />}
              {condition && <Chip label={condition} onRemove={() => setCondition('')} />}
            </div>
          )}

          {/* Save search */}
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-outline btn-sm btn-block"
              onClick={saveSearch}
              disabled={!hasFilters}
              style={{ justifyContent: 'center' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              Save this search
            </button>
            {savedMsg && (
              <div style={s.savedMsg}>{savedMsg}</div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={s.main}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading listings…</p>
          </div>
        ) : books.length === 0 ? (
          <div style={s.emptyWrap}>
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>{hasFilters ? 'No books match your filters. Try clearing some.' : 'No books available yet. Be the first to post one!'}</p>
              {hasFilters && (
                <button className="btn btn-outline" onClick={clearAll} style={{ marginTop: 16 }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {books.map((book, i) => (
              <BookCard key={book._id} book={book} index={i} onClick={b => openBook(b, i)} />
            ))}
          </div>
        )}
      </div>

      </div>{/* end contentRow */}

      <BookModal book={selected} index={selectedIdx} onClose={() => setSelected(null)} />
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <div style={chip}>
      {label}
      <button onClick={onRemove} style={chipX}>×</button>
    </div>
  );
}

const chip  = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--orange)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px 3px 10px', borderRadius: 20 };
const chipX = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' };

const s = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 24px',
  },
  pageTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 10,
  },
  contentRow: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  sidebar: { width: 230, flexShrink: 0 },
  sideCard: {
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 16px',
    position: 'sticky',
    top: 76,
  },
  sideHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sideTitle:  { fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  clearBtn:   { fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' },
  sideSection:{ marginBottom: 14 },
  sideLabel:  { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 9, width: 14, height: 14, color: 'var(--muted)', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '8px 28px 8px 30px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)', fontSize: 13, background: '#fff',
    outline: 'none', transition: 'border-color .18s', color: 'var(--text)',
  },
  clearX: { position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 2 },
  filterSelect: {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)', fontSize: 13, background: '#fff',
    color: 'var(--text)', cursor: 'pointer', outline: 'none',
  },
  chips:   { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  savedMsg:{ fontSize: 12, color: 'var(--success)', fontWeight: 500, marginTop: 7, textAlign: 'center' },
  main:    { flex: 1, minWidth: 0 },
  heading: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 6, lineHeight: 1.15, fontFamily: "'Nunito', var(--font)", opacity: 0.8 },
  sub:     { fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 },
  count:   { fontSize: 13, color: 'var(--muted)', fontWeight: 500, background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px' },
  emptyWrap: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 40 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 },
};
