import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const SUBJECTS = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Economics','Literature','History','Other'];
const CONDITIONS = ['Like New','Good','Fair','Worn'];

const COVER_COLORS = [
  '#1a1a2e','#16213e','#0f3460','#533483','#2d6a4f',
  '#1b4332','#6d4c41','#37474f','#4a148c','#880e4f',
];
const COVER_TEXT_COLORS = ['#e8d5b7','#f0e6d3','#d4e8ff','#e8d4f0','#d4ead4'];

const SUBJECT_ABBR = {
  'Computer Science': 'CS', 'Mathematics': 'MATH', 'Physics': 'PHYS',
  'Chemistry': 'CHEM', 'Biology': 'BIO', 'Engineering': 'ENGR',
  'Economics': 'ECON', 'Literature': 'LIT', 'History': 'HIST', 'Other': 'GEN',
};

function BookCover({ book, index }) {
  const bg = COVER_COLORS[index % COVER_COLORS.length];
  const textColor = COVER_TEXT_COLORS[index % COVER_TEXT_COLORS.length];
  const abbr = SUBJECT_ABBR[book.subject] || 'BOOK';
  return (
    <div style={{ ...coverStyle, background: bg }}>
      <div style={{ ...coverSpine, background: 'rgba(0,0,0,0.25)' }} />
      <div style={coverContent}>
        <div style={{ ...coverAbbr, color: textColor }}>{abbr}</div>
        <div style={{ ...coverTitle, color: 'rgba(255,255,255,0.9)' }}>{book.title}</div>
        {book.author && <div style={{ ...coverAuthor, color: 'rgba(255,255,255,0.55)' }}>{book.author}</div>}
      </div>
    </div>
  );
}

export default function BrowseBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [offerBook, setOfferBook] = useState('');
  const [message, setMessage] = useState('');
  const [reqStatus, setReqStatus] = useState({ loading: false, msg: '', ok: false });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (filterSubject) params.subject = filterSubject;
      if (filterCondition) params.condition = filterCondition;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterSubject, filterCondition]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const openBook = async (book, index) => {
    setSelected(book);
    setSelectedIndex(index);
    setOfferBook(''); setMessage('');
    setReqStatus({ loading: false, msg: '', ok: false });
    try { await api.get(`/books/${book._id}`); } catch (e) {}
  };

  const sendRequest = async () => {
    if (!offerBook.trim()) {
      setReqStatus({ loading: false, msg: 'Please enter the book you are offering.', ok: false });
      return;
    }
    setReqStatus({ loading: true, msg: '', ok: false });
    try {
      await api.post('/requests', { bookId: selected._id, offerBook, message });
      setReqStatus({ loading: false, msg: 'Request sent! The owner will see it in their Requests tab.', ok: true });
    } catch (e) {
      setReqStatus({ loading: false, msg: e.response?.data?.message || 'Error sending request.', ok: false });
    }
  };

  const conditionColor = (c) => {
    if (c === 'Like New') return 'badge-green';
    if (c === 'Worn') return 'badge-amber';
    return 'badge-blue';
  };

  return (
    <div>
      {/* Page heading */}
      <div style={s.pageTop}>
        <div>
          <h1 style={s.heading}>Browse Books</h1>
          <p style={s.subheading}>Find textbooks available for exchange from fellow students</p>
        </div>
        {!loading && <span style={s.countBadge}>{books.length} listing{books.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Search & filters */}
      <div style={s.toolbar}>
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
        </div>
        <select style={s.select} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All subjects</option>
          {SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
        </select>
        <select style={s.select} value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
          <option value="">Any condition</option>
          {CONDITIONS.map(c => <option key={c}>{c}</option>)}
        </select>
        {(search || filterSubject || filterCondition) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterSubject(''); setFilterCondition(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Book grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '72px 0' }}>
          <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading listings…</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No books found. Try a different search or be the first to post one!</p>
        </div>
      ) : (
        <div style={s.grid}>
          {books.map((book, i) => (
            <div key={book._id} style={s.card} onClick={() => openBook(book, i)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <BookCover book={book} index={i} />
              <div style={s.cardBody}>
                <div style={s.cardTitle}>{book.title}</div>
                {book.author && <div style={s.cardAuthor}>{book.author}</div>}
                <div style={s.cardFooter}>
                  <span className={`badge ${conditionColor(book.condition)}`}>{book.condition}</span>
                  <span style={s.ownerTag}>{book.owner?.studentId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book detail modal */}
      {selected && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={s.modal}>
            <button style={s.closeBtn} onClick={() => setSelected(null)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l12 12M14 2L2 14"/>
              </svg>
            </button>

            <div style={s.modalTop}>
              <div style={{ flex: '0 0 140px' }}>
                <BookCover book={selected} index={selectedIndex} />
              </div>
              <div style={s.modalInfo}>
                <div style={s.modalSubject}>{selected.subject}</div>
                <h2 style={s.modalTitle}>{selected.title}</h2>
                <p style={s.modalAuthor}>by {selected.author}</p>
                <div style={s.modalBadges}>
                  <span className={`badge ${conditionColor(selected.condition)}`}>{selected.condition}</span>
                  <span className="badge badge-gray">{selected.owner?.department}</span>
                </div>
                <div style={s.sellerRow}>
                  <div style={s.sellerAvatar}>{(selected.owner?.fullName || 'S')[0]}</div>
                  <div>
                    <div style={s.sellerName}>{selected.owner?.fullName}</div>
                    <div style={s.sellerId}>{selected.owner?.studentId}</div>
                  </div>
                </div>
              </div>
            </div>

            {selected.description && (
              <div style={s.descBlock}>
                <div style={s.descLabel}>Description</div>
                <p style={s.descText}>{selected.description}</p>
              </div>
            )}

            <div style={s.requestSection}>
              <div style={s.requestHeading}>Request an exchange</div>
              <div className="field">
                <label>Your offer — what book will you exchange?</label>
                <input value={offerBook} onChange={e => setOfferBook(e.target.value)} placeholder="e.g. Calculus by Stewart (Good condition)" />
              </div>
              <div className="field">
                <label>Message to owner <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi! I'd love to exchange this book…" style={{ minHeight: 70 }} />
              </div>
              {reqStatus.msg && <div className={`alert ${reqStatus.ok ? 'alert-ok' : 'alert-err'}`}>{reqStatus.msg}</div>}
              {!reqStatus.ok && (
                <button className="btn btn-primary btn-block" onClick={sendRequest} disabled={reqStatus.loading} style={{ marginTop: 12 }}>
                  {reqStatus.loading ? <span className="spinner" /> : null}
                  {reqStatus.loading ? 'Sending…' : 'Send Exchange Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const coverStyle = {
  width: '100%',
  aspectRatio: '2/3',
  borderRadius: 6,
  marginBottom: 12,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexShrink: 0,
};
const coverSpine = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 10,
};
const coverContent = {
  flex: 1,
  padding: '16px 12px 12px 20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
};
const coverAbbr = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  marginBottom: 6,
  opacity: 0.7,
};
const coverTitle = {
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.3,
  marginBottom: 4,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};
const coverAuthor = {
  fontSize: 10,
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const s = {
  pageTop: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 22,
    flexWrap: 'wrap',
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#111',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: 'var(--muted)',
  },
  countBadge: {
    fontSize: 13,
    color: 'var(--muted)',
    fontWeight: 500,
  },
  toolbar: {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrap: {
    flex: '2 1 220px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 11,
    width: 16,
    height: 16,
    color: 'var(--muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 34px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    background: '#fff',
    outline: 'none',
    transition: 'border-color .18s',
  },
  select: {
    flex: '1 1 140px',
    padding: '9px 12px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    background: '#fff',
    color: 'var(--text)',
    cursor: 'pointer',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(172px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 12,
    cursor: 'pointer',
    transition: 'box-shadow .2s, transform .2s',
    boxShadow: 'var(--shadow-sm)',
  },
  cardBody: {
    padding: '2px 2px 0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
    color: '#111',
    marginBottom: 3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardAuthor: {
    fontSize: 12,
    color: 'var(--muted)',
    marginBottom: 8,
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerTag: {
    fontSize: 11,
    color: 'var(--muted)',
    fontWeight: 500,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    padding: '28px',
    maxWidth: 560,
    width: '100%',
    position: 'relative',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-lg)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'var(--accent-light)',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)',
    transition: 'var(--transition)',
  },
  modalTop: {
    display: 'flex',
    gap: 20,
    marginBottom: 20,
  },
  modalInfo: {
    flex: 1,
    paddingTop: 4,
  },
  modalSubject: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  modalAuthor: {
    fontSize: 13,
    color: 'var(--muted)',
    marginBottom: 12,
  },
  modalBadges: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  sellerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
    padding: '10px 12px',
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  },
  sellerAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#111',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111',
  },
  sellerId: {
    fontSize: 11,
    color: 'var(--muted)',
  },
  descBlock: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    marginBottom: 20,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.7,
  },
  requestSection: {
    borderTop: '1px solid var(--border)',
    paddingTop: 20,
  },
  requestHeading: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    marginBottom: 16,
    letterSpacing: '-0.01em',
  },
};
