import React, { useState, useEffect, useCallback } from 'react';
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
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subject, setSubject]       = useState('');
  const [condition, setCondition]   = useState('');
  const [sort, setSort]             = useState('newest');
  const [selected, setSelected]     = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

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

  const clearAll = () => { setSearch(''); setDebouncedSearch(''); setSubject(''); setCondition(''); setSort('newest'); };
  const hasFilters = search || subject || condition || sort !== 'newest';

  const openBook = (book, i) => { setSelected(book); setSelectedIdx(i); };

  return (
    <div style={s.page}>
      {/* ── Page heading ── */}
      <div style={s.pageTop}>
        <div>
          <h1 style={s.heading}>Browse Books</h1>
          <p style={s.sub}>Find textbooks available for exchange from fellow students</p>
        </div>
        {!loading && <span style={s.count}>{books.length} listing{books.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* ── Search bar ── */}
      <div style={s.searchBar}>
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3" strokeLinecap="round"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search by title, author or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearX} onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={s.filtersRow}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Subject</label>
          <select style={s.filterSelect} value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
          </select>
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Condition</label>
          <select style={s.filterSelect} value={condition} onChange={e => setCondition(e.target.value)}>
            <option value="">Any condition</option>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Sort by</label>
          <select style={s.filterSelect} value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ alignSelf: 'flex-end', marginBottom: 1 }}>
            Clear all ×
          </button>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {(subject || condition) && (
        <div style={s.chips}>
          {subject   && <Chip label={subject}   onRemove={() => setSubject('')} />}
          {condition && <Chip label={condition} onRemove={() => setCondition('')} />}
        </div>
      )}

      {/* ── Results ── */}
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
            {hasFilters && <button className="btn btn-outline" onClick={clearAll} style={{ marginTop: 16 }}>Clear filters</button>}
          </div>
        </div>
      ) : (
        <div style={s.grid}>
          {books.map((book, i) => (
            <BookCard key={book._id} book={book} index={i} onClick={b => openBook(b, i)} />
          ))}
        </div>
      )}

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

const chip  = { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#111', color: '#fff', fontSize: 12, fontWeight: 500, padding: '3px 10px 3px 12px', borderRadius: 20 };
const chipX = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' };

const s = {
  page:        { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  pageTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  heading:     { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 4 },
  sub:         { fontSize: 14, color: 'var(--muted)' },
  count:       { fontSize: 13, color: 'var(--muted)', fontWeight: 500 },
  searchBar:   { marginBottom: 14 },
  searchWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon:  { position: 'absolute', left: 13, width: 16, height: 16, color: 'var(--muted)', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '11px 40px 11px 38px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)', fontSize: 14, background: '#fff',
    outline: 'none', transition: 'border-color .18s',
  },
  clearX: { position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4 },
  filtersRow:  { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  filterLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  filterSelect:{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font)', fontSize: 13, background: '#fff', color: 'var(--text)', cursor: 'pointer', outline: 'none', minWidth: 150 },
  chips:       { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  emptyWrap:   { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 40 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 16 },
};
