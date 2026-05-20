import React from 'react';

const COVER_COLORS = [
  '#003DA5','#002d7a','#1a56c8','#FF6B00','#d95a00',
  '#0050b3','#1e40af','#c84b00','#003080','#ff8c33',
  '#1d4ed8','#0047cc','#e65c00','#2952a3','#ff7a1a',
];
const COVER_ACCENTS = [
  '#ffd580','#ffbc6b','#fff0e5','#dce8ff','#ffe0c2',
  '#ffd166','#ffe8cc','#d4e8ff','#ffecd9','#cce0ff',
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
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,61,165,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue-light)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
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
const title  = { fontSize: 13, fontWeight: 700, lineHeight: 1.35, color: 'var(--text)', marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const author = { fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const footer = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const ownerTag = { fontSize: 11, color: 'var(--muted)', fontWeight: 500 };
