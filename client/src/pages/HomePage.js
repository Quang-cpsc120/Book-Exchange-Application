import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import api from '../utils/api';

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData]     = useState({ majorBooks: [], classBooks: [], newArrivals: [] });
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

  const allBooks = [...data.majorBooks, ...data.classBooks, ...data.newArrivals];

  return (
    <div style={s.page}>
      {/* ── Hero / welcome banner ── */}
      <div style={s.hero}>
        <div style={s.heroLeft}>
          <div style={s.heroAvatar}>{initials(user?.fullName)}</div>
          <div>
            <h1 style={s.heroHeading}>Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
            <p style={s.heroSub}>
              {user?.department && <span style={s.heroPill}>{user.department}</span>}
              {user?.year        && <span style={s.heroPill}>{user.year}</span>}
              {user?.classes?.length > 0 && <span style={s.heroPill}>{user.classes.length} class{user.classes.length !== 1 ? 'es' : ''}</span>}
              {!user?.department && !user?.year && 'Complete your profile to get personalized recommendations'}
            </p>
          </div>
        </div>
        <div style={s.heroStats}>
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
          {/* ── Tier 1: Major match ── */}
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

          {/* ── Tier 2: Class match ── */}
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

          {/* ── Tier 3: New arrivals ── */}
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

          {/* Empty state */}
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

          {/* Browse all CTA */}
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
