import React from 'react';

const COVER_COLORS = [
  '#1a1a2e','#16213e','#0f3460','#533483','#2d6a4f',
  '#1b4332','#6d4c41','#37474f','#4a148c','#880e4f',
  '#1565c0','#006064','#2e7d32','#4e342e','#283593',
];
const COVER_ACCENTS = [
  '#e8d5b7','#f0e6d3','#d4e8ff','#e8d4f0','#d4ead4',
  '#c8e6c9','#ffccbc','#cfd8dc','#e1bee7','#fce4ec',
];

const SUBJECT_ABBR = {
  'Computer Science':'CS','Mathematics':'MATH','Physics':'PHYS',
  'Chemistry':'CHEM','Biology':'BIO','Engineering':'ENGR',
  'Economics':'ECON','Literature':'LIT','History':'HIST','Other':'GEN',
};

function conditionClass(c) {
  if (c === 'Like New') return 'badge-green';
  if (c === 'Worn')     return 'badge-amber';
  return 'badge-blue';
}

export function BookCover({ book, index, style = {} }) {
  const i   = index % COVER_COLORS.length;
  const bg  = COVER_COLORS[i];
  const acc = COVER_ACCENTS[i % COVER_ACCENTS.length];
  const abbr = SUBJECT_ABBR[book.subject] || 'BOOK';

  return (
    <div style={{ ...coverWrap, background: bg, ...style }}>
      <div style={{ ...spine, background: 'rgba(0,0,0,0.22)' }} />
      <div style={coverBody}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: acc, opacity: 0.75, marginBottom: 5 }}>{abbr}</div>
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: '#fff', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 4 }}>{book.title}</div>
        {book.author && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.author}</div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 10, right: 0, height: 3, background: acc, opacity: 0.4, borderRadius: '0 0 0 0' }} />
    </div>
  );
}

export default function BookCard({ book, index, onClick }) {
  return (
    <div
      style={card}
      onClick={() => onClick && onClick(book)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
    >
      <BookCover book={book} index={index} />
      <div style={body}>
        <div style={title}>{book.title}</div>
        {book.author && <div style={author}>{book.author}</div>}
        <div style={footer}>
          <span className={`badge ${conditionClass(book.condition)}`}>{book.condition}</span>
          <span style={ownerTag}>{book.owner?.studentId}</span>
        </div>
      </div>
    </div>
  );
}

const coverWrap = {
  width: '100%', aspectRatio: '2/3', borderRadius: 6,
  marginBottom: 10, position: 'relative', overflow: 'hidden',
  display: 'flex', flexShrink: 0,
};
const spine    = { position: 'absolute', left: 0, top: 0, bottom: 0, width: 9 };
const coverBody = { flex: 1, padding: '14px 10px 12px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const card   = { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 12, cursor: 'pointer', transition: 'box-shadow .2s, transform .2s', boxShadow: 'var(--shadow-sm)' };
const body   = { padding: '0 2px' };
const title  = { fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: '#111', marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const author = { fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const footer = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const ownerTag = { fontSize: 11, color: 'var(--muted)', fontWeight: 500 };
