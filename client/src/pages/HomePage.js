import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import api from '../utils/api';
import useIsMobile from '../hooks/useIsMobile';

// ── Cover color palette (matches BookCard) ────────────────────────────────────
const SLIDE_COLORS = [
  '#003DA5','#002d7a','#1a56c8','#FF6B00','#d95a00',
  '#0050b3','#1e40af','#c84b00','#003080','#ff8c33',
];
const SLIDE_ACCENTS = [
  '#ffd580','#ffbc6b','#fff0e5','#dce8ff','#ffe0c2',
  '#ffd166','#ffe8cc','#d4e8ff','#ffecd9','#cce0ff',
];

const SUBJECT_ABBR = {
  'Computer Science':'CS','Mathematics':'MATH','Physics':'PHYS',
  'Chemistry':'CHEM','Biology':'BIO','Engineering':'ENGR',
  'Economics':'ECON','Literature':'LIT','History':'HIST','Other':'GEN',
};

const CONDITION_COLOR = {
  'Like New': { bg: '#dcfce7', color: '#166534' },
  'Good':     { bg: '#dce8ff', color: '#003DA5' },
  'Fair':     { bg: '#fef3c7', color: '#92400e' },
  'Worn':     { bg: '#fee2e2', color: '#b91c1c' },
};

// ── NewArrivalsSlider ─────────────────────────────────────────────────────────
function NewArrivalsSlider({ books, onOpen }) {
  const isMobile = useIsMobile();
  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [paused, setPaused]     = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx, dir = 'next') => {
    if (animating || books.length <= 1) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 380);
  }, [animating, books.length]);

  const next = useCallback(() => goTo((current + 1) % books.length, 'next'), [current, books.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + books.length) % books.length, 'prev'), [current, books.length, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (paused || books.length <= 1) return;
    timerRef.current = setTimeout(next, 5000);
    return () => clearTimeout(timerRef.current);
  }, [current, paused, books.length, next]);

  if (books.length === 0) return null;

  const book     = books[current];
  const colorIdx = current % SLIDE_COLORS.length;
  const bg       = SLIDE_COLORS[colorIdx];
  const acc      = SLIDE_ACCENTS[colorIdx];
  const abbr     = SUBJECT_ABBR[book.subject] || 'BOOK';
  const cond     = CONDITION_COLOR[book.condition] || CONDITION_COLOR['Good'];

  const slideStyle = {
    ...sl.slide,
    opacity:   animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction === 'next' ? '24px' : '-24px'})`
      : 'translateX(0)',
    transition: animating ? 'none' : 'opacity .38s ease, transform .38s ease',
  };

  return (
    <div
      style={sl.wrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Heading strip */}
      <div style={sl.strip}>
        <span style={sl.stripLabel}>🆕 Newest Listings</span>
        <span style={sl.stripCount}>{current + 1} / {books.length}</span>
      </div>

      {/* Main slide */}
      <div style={{ ...slideStyle, flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '14px 14px 8px' : '20px 60px 20px 20px', minHeight: isMobile ? 'auto' : 190 }}>
        {/* Book spine cover — hidden on mobile to save space */}
        {!isMobile && (
          <div style={{ ...sl.cover, background: bg }}>
            <div style={{ ...sl.spine, background: 'rgba(0,0,0,0.2)' }} />
            <div style={sl.coverBody}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: acc, opacity: 0.85, marginBottom: 6 }}>{abbr}</div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: '#fff', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</div>
              {book.author && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.author}</div>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 10, right: 0, height: 3, background: acc, opacity: 0.5 }} />
          </div>
        )}

        {/* Book info */}
        <div style={sl.info}>
          <div style={sl.badges}>
            <span style={{ ...sl.badge, background: cond.bg, color: cond.color }}>{book.condition}</span>
            <span style={{ ...sl.badge, background: 'var(--blue-light)', color: 'var(--blue)' }}>{book.subject}</span>
          </div>

          <h2 style={{ ...sl.title, fontSize: isMobile ? 16 : 20 }}>{book.title}</h2>
          <div style={sl.author}>by {book.author}</div>

          {!isMobile && (
            <p style={sl.desc}>
              {book.description
                ? book.description.length > 200
                  ? book.description.slice(0, 200) + '…'
                  : book.description
                : `A ${book.subject} textbook in ${book.condition?.toLowerCase()} condition, available for exchange.`
              }
            </p>
          )}

          <div style={sl.footer}>
            <span style={sl.postedBy}>
              📌 {book.owner?.fullName || 'a student'}
              {book.owner?.department ? ` · ${book.owner.department}` : ''}
            </span>
            <button
              className="btn btn-cta btn-sm"
              onClick={() => onOpen(book, current)}
            >
              View →
            </button>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {books.length > 1 && (
        <>
          <button onClick={prev} style={{ ...sl.arrow, left: 8 }} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={next} style={{ ...sl.arrow, right: 8 }} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {books.length > 1 && (
        <div style={sl.dots}>
          {books.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              style={{
                ...sl.dot,
                background: i === current ? 'var(--orange)' : 'rgba(0,61,165,0.2)',
                width: i === current ? 22 : 8,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!paused && books.length > 1 && (
        <div style={sl.progressWrap}>
          <div
            key={current}
            style={sl.progressBar}
          />
        </div>
      )}
    </div>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [data, setData]       = useState({ majorBooks: [], classBooks: [], newArrivals: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    api.get('/books/recommended')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openBook = (book, globalIdx) => { setSelected(book); setSelectedIdx(globalIdx); };

  const profileComplete = user?.department && user?.year && user?.classes?.length > 0;
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const allBooks    = [...data.majorBooks, ...data.classBooks, ...data.newArrivals];
  // Slider shows all unique books, newest-first (newArrivals first, then rest)
  const sliderBooks = [...data.newArrivals, ...data.classBooks, ...data.majorBooks].slice(0, 10);

  return (
    <div style={{ ...s.page, padding: isMobile ? '16px 14px' : '32px 24px' }}>

      {/* ── Hero / welcome banner ── */}
      <div style={{ ...s.hero, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', padding: isMobile ? '20px 18px' : '26px 30px' }}>
        <div style={s.heroLeft}>
          <div style={s.heroAvatar}>{initials(user?.fullName)}</div>
          <div>
            <h1 style={{ ...s.heroHeading, fontSize: isMobile ? 17 : 20 }}>Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
            <p style={s.heroSub}>
              {user?.department && <span style={s.heroPill}>{user.department}</span>}
              {user?.year        && <span style={s.heroPill}>{user.year}</span>}
              {user?.classes?.length > 0 && <span style={s.heroPill}>{user.classes.length} class{user.classes.length !== 1 ? 'es' : ''}</span>}
              {!user?.department && !user?.year && 'Complete your profile to get personalized recommendations'}
            </p>
          </div>
        </div>
        <div style={{ ...s.heroStats, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-around' : 'flex-start', marginTop: isMobile ? 14 : 0 }}>
          <div style={s.statItem}>
            <span style={s.statNum}>{user?.booksPosted || 0}</span>
            <span style={s.statLbl}>Listed</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.statItem}>
            <span style={s.statNum}>{user?.exchangesCompleted || 0}</span>
            <span style={s.statLbl}>Exchanged</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.statItem}>
            <span style={s.statNum}>{allBooks.length}</span>
            <span style={s.statLbl}>For you</span>
          </div>
        </div>
      </div>

      {/* ── Newest listings slider ── */}
      {!loading && sliderBooks.length > 0 && (
        <NewArrivalsSlider books={sliderBooks} onOpen={openBook} />
      )}

      {/* ── Profile nudge ── */}
      {!profileComplete && (
        <div style={s.nudge}>
          <div style={s.nudgeIcon}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={s.nudgeTitle}>Get better recommendations</div>
            <div style={s.nudgeSub}>Add your major, year, and classes to see books tailored to your courses.</div>
          </div>
          <Link to="/profile" className="btn btn-cta btn-sm">Update profile →</Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Finding books for you…</p>
        </div>
      ) : (
        <>
          {data.majorBooks.length > 0 && (
            <Section
              icon="🎓"
              title={`Recommended for ${user?.department || 'your major'}`}
              sub="Books that match your department"
              books={data.majorBooks}
              startIdx={0}
              onOpen={openBook}
            />
          )}

          {data.classBooks.length > 0 && (
            <Section
              icon="📖"
              title="Matching your classes"
              sub={`Based on: ${user?.classes?.join(', ')}`}
              books={data.classBooks}
              startIdx={data.majorBooks.length}
              onOpen={openBook}
            />
          )}

          {data.newArrivals.length > 0 && (
            <Section
              icon="🆕"
              title="New arrivals"
              sub="Recently posted by students"
              books={data.newArrivals}
              startIdx={data.majorBooks.length + data.classBooks.length}
              onOpen={openBook}
            />
          )}

          {allBooks.length === 0 && (
            <div style={s.emptyWrap}>
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>No books available yet. Be the first to post one!</p>
                <div style={{ marginTop: 20 }}>
                  <Link to="/browse" className="btn btn-cta">Browse all books</Link>
                </div>
              </div>
            </div>
          )}

          {allBooks.length > 0 && (
            <div style={s.browseAll}>
              <Link to="/browse" className="btn btn-outline">View all listings →</Link>
            </div>
          )}
        </>
      )}

      <BookModal book={selected} index={selectedIdx} onClose={() => setSelected(null)} />
    </div>
  );
}

function Section({ icon, title, sub, books, startIdx, onOpen }) {
  return (
    <div style={sec.wrap}>
      <div style={sec.header}>
        <div>
          <h2 style={sec.title}><span style={{ marginRight: 8 }}>{icon}</span>{title}</h2>
          {sub && <p style={sec.sub}>{sub}</p>}
        </div>
        <span style={sec.count}>{books.length} book{books.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={sec.grid}>
        {books.map((book, i) => (
          <BookCard key={book._id} book={book} index={startIdx + i} onClick={b => onOpen(b, startIdx + i)} />
        ))}
      </div>
    </div>
  );
}

// ── Slider styles ─────────────────────────────────────────────────────────────
const sl = {
  wrap: {
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: 'var(--shadow)',
  },
  strip: {
    background: 'linear-gradient(90deg, var(--blue) 0%, var(--blue-mid) 100%)',
    padding: '8px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripLabel: { fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' },
  stripCount: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
  slide: {
    display: 'flex',
    alignItems: 'stretch',
    minHeight: 190,
    padding: '20px 60px 20px 20px',
    gap: 22,
  },
  cover: {
    width: 110,
    flexShrink: 0,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
  },
  spine: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 10,
  },
  coverBody: {
    flex: 1,
    padding: '16px 10px 14px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  badges: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--text)',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  author: { fontSize: 13, color: 'var(--muted)', fontWeight: 500 },
  desc: {
    fontSize: 13,
    color: 'var(--muted)',
    lineHeight: 1.65,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  postedBy: { fontSize: 12, color: 'var(--muted)', fontWeight: 500 },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.95)',
    border: '1.5px solid var(--border)',
    borderRadius: '50%',
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--blue)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    zIndex: 2,
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    padding: '0 0 12px',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .3s ease',
    padding: 0,
  },
  progressWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'var(--blue-light)',
  },
  progressBar: {
    height: '100%',
    background: 'var(--orange)',
    borderRadius: '0 2px 2px 0',
    animation: 'slideProgress 5s linear forwards',
  },
};

// ── Page styles ───────────────────────────────────────────────────────────────
const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  hero: {
    background: 'linear-gradient(135deg, var(--blue-dark) 0%, var(--blue) 60%, #2060d8 100%)',
    borderRadius: 'var(--radius-xl)',
    padding: '26px 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    boxShadow: '0 4px 20px rgba(0,61,165,0.25)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroLeft:    { display: 'flex', alignItems: 'center', gap: 16 },
  heroAvatar:  { width: 52, height: 52, borderRadius: '50%', background: 'var(--orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 10px rgba(255,107,0,0.4)' },
  heroHeading: { fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 },
  heroSub:     { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  heroPill:    { fontSize: 12, background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '3px 12px', borderRadius: 20, fontWeight: 600 },
  heroStats:   { display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', padding: '12px 22px', backdropFilter: 'blur(4px)' },
  statItem:    { textAlign: 'center' },
  statNum:     { display: 'block', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' },
  statLbl:     { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 500 },
  statDiv:     { width: 1, height: 32, background: 'rgba(255,255,255,0.2)' },
  nudge: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'var(--orange-xlight)', border: '1.5px solid var(--orange-light)',
    borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 28,
    borderLeft: '4px solid var(--orange)',
  },
  nudgeIcon:  { fontSize: 22 },
  nudgeTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  nudgeSub:   { fontSize: 12, color: 'var(--muted)' },
  emptyWrap:  { background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 40, boxShadow: 'var(--shadow-sm)' },
  browseAll:  { textAlign: 'center', paddingTop: 16 },
};

const sec = {
  wrap:   { marginBottom: 40 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  title:  { fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 2 },
  sub:    { fontSize: 13, color: 'var(--muted)' },
  count:  { fontSize: 13, color: 'var(--muted)', fontWeight: 600, flexShrink: 0, paddingTop: 3 },
  grid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 },
};
