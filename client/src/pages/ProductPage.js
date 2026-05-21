import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import api from '../utils/api';
import useIsMobile from '../hooks/useIsMobile';

const SUBJECTS   = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS = ['Like New','Good','Fair','Worn'];
const SORTS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'condition', label: 'Best condition' },
];

export default function ProductPage() {
  const location = useLocation();
  const isMobile = useIsMobile();

  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subject, setSubject]       = useState('');
  const [condition, setCondition]   = useState('');
  const [sort, setSort]             = useState('newest');
  const [classCode, setClassCode]   = useState('');
  const [debouncedClass, setDebouncedClass] = useState('');
  const [selected, setSelected]     = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [savedMsg, setSavedMsg]     = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pre-populate filters from URL params (e.g. from watchlist "Browse" link)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('q'))       { setSearch(p.get('q')); setDebouncedSearch(p.get('q')); }
    if (p.get('subject')) setSubject(p.get('subject'));
  }, []);

  // 400ms debounce on search + class inputs
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedClass(classCode), 400);
    return () => clearTimeout(t);
  }, [classCode]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (debouncedSearch) params.q         = debouncedSearch;
      if (subject)         params.subject   = subject;
      if (condition)       params.condition = condition;
      if (debouncedClass)  params.classCode = debouncedClass;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subject, condition, sort, debouncedClass]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // Close sidebar + lock body scroll on mobile
  useEffect(() => {
    if (!isMobile) { setSidebarOpen(false); return; }
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile]);

  const clearAll = () => {
    setSearch(''); setDebouncedSearch('');
    setSubject(''); setCondition(''); setSort('newest');
    setClassCode(''); setDebouncedClass('');
  };

  const hasFilters = !!(search || subject || condition || sort !== 'newest' || classCode);
  const activeFilterCount = [search, subject, condition, sort !== 'newest' ? sort : '', classCode].filter(Boolean).length;

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

  const sidebarContent = (
    <div style={isMobile ? s.sideCardMobile : s.sideCard}>
      <div style={s.sideHeader}>
        <span style={s.sideTitle}>Filters</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasFilters && (
            <button style={s.clearBtn} onClick={clearAll}>Clear all</button>
          )}
          {isMobile && (
            <button style={s.closeSidebar} onClick={() => setSidebarOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
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

      {/* Major */}
      <div style={s.sideSection}>
        <label style={s.sideLabel}>Major</label>
        <select style={s.filterSelect} value={subject} onChange={e => setSubject(e.target.value)}>
          <option value="">All majors</option>
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

      {/* Class */}
      <div style={s.sideSection}>
        <label style={s.sideLabel}>Class</label>
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 2L2 6l8 4 8-4-8-4zM2 14l8 4 8-4M2 10l8 4 8-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="e.g. CPSC 120, MATH 150…"
            value={classCode}
            onChange={e => setClassCode(e.target.value)}
          />
          {classCode && (
            <button style={s.clearX} onClick={() => setClassCode('')}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Active chips */}
      {(subject || condition || classCode) && (
        <div style={s.chips}>
          {subject   && <Chip label={subject}             onRemove={() => setSubject('')} />}
          {condition && <Chip label={condition}           onRemove={() => setCondition('')} />}
          {classCode && <Chip label={`Class: ${classCode}`} onRemove={() => setClassCode('')} />}
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
  );

  return (
    <div style={{ ...s.page, padding: isMobile ? '20px 14px' : '32px 24px' }}>
      {/* ── Page heading (full width) ── */}
      <div style={s.pageTop}>
        <div>
          <h1 style={s.heading}>Browse Books</h1>
          <p style={s.sub}>Find textbooks available for exchange from fellow Titans</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isMobile && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
              Filters
              {activeFilterCount > 0 && (
                <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
          {!loading && (
            <span style={s.count}>{books.length} listing{books.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div style={isMobile ? s.contentRowMobile : s.contentRow}>
        {/* ── Desktop sidebar ── */}
        {!isMobile && (
          <aside style={s.sidebar}>
            {sidebarContent}
          </aside>
        )}

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
            <div style={{ ...s.grid, gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {books.map((book, i) => (
                <BookCard key={book._id} book={book} index={i} onClick={b => openBook(b, i)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      {isMobile && sidebarOpen && (
        <>
          <div className="mobile-backdrop visible" onClick={() => setSidebarOpen(false)} />
          <div style={s.mobileSidebar}>
            {sidebarContent}
          </div>
        </>
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

const chip  = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--orange)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px 3px 10px', borderRadius: 20 };
const chipX = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' };

const s = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
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
  contentRowMobile: {
    display: 'block',
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
  sideCardMobile: {
    padding: '18px 16px',
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    background: '#fff',
    zIndex: 201,
    overflowY: 'auto',
    boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    animation: 'slideInLeft .22s ease',
  },
  sideHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 0 4px' },
  sideTitle:  { fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  clearBtn:   { fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' },
  closeSidebar: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4 },
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
  grid:    { display: 'grid', gap: 16 },
};
