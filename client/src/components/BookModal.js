import React, { useState } from 'react';
import { BookCover } from './BookCard';
import api from '../utils/api';

function conditionClass(c) {
  if (c === 'Like New') return 'badge-green';
  if (c === 'Worn')     return 'badge-amber';
  return 'badge-blue';
}

export default function BookModal({ book, index, onClose }) {
  const [offerBook, setOfferBook] = useState('');
  const [message,   setMessage]   = useState('');
  const [status, setStatus] = useState({ loading: false, msg: '', ok: false });

  if (!book) return null;

  const sendRequest = async () => {
    if (!offerBook.trim()) {
      setStatus({ loading: false, msg: 'Please enter the book you are offering.', ok: false });
      return;
    }
    setStatus({ loading: true, msg: '', ok: false });
    try {
      await api.post('/requests', { bookId: book._id, offerBook, message });
      setStatus({ loading: false, msg: 'Request sent! The owner will see it in their Requests tab.', ok: true });
    } catch (e) {
      setStatus({ loading: false, msg: e.response?.data?.message || 'Error sending request.', ok: false });
    }
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        {/* Close */}
        <button style={closeBtn} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M2 2l12 12M14 2L2 14"/>
          </svg>
        </button>

        {/* Top section: cover + info */}
        <div style={topRow}>
          <div style={{ flex: '0 0 130px' }}>
            <BookCover book={book} index={index} />
          </div>
          <div style={infoCol}>
            <div style={subjectLabel}>{book.subject}</div>
            <h2 style={titleStyle}>{book.title}</h2>
            {book.author && <p style={authorStyle}>by {book.author}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge ${conditionClass(book.condition)}`}>{book.condition}</span>
              {book.owner?.department && <span className="badge badge-gray">{book.owner.department}</span>}
              {book.owner?.year && <span className="badge badge-gray">{book.owner.year}</span>}
            </div>
            <div style={sellerRow}>
              <div style={sellerAvatar}>{(book.owner?.fullName || 'S')[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{book.owner?.fullName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{book.owner?.studentId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div style={descBlock}>
            <div style={descLabel}>Description</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{book.description}</p>
          </div>
        )}

        {/* Request section */}
        <div style={requestSection}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>
            Request an exchange
          </div>
          <div className="field">
            <label>Your offer — what book will you exchange?</label>
            <input value={offerBook} onChange={e => setOfferBook(e.target.value)} placeholder="e.g. Calculus by Stewart (Good condition)" disabled={status.ok} />
          </div>
          <div className="field">
            <label>Message to owner <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi! I'd love to exchange this book…" style={{ minHeight: 68 }} disabled={status.ok} />
          </div>
          {status.msg && <div className={`alert ${status.ok ? 'alert-ok' : 'alert-err'}`}>{status.msg}</div>}
          {!status.ok && (
            <button className="btn btn-primary btn-block" onClick={sendRequest} disabled={status.loading} style={{ marginTop: 12 }}>
              {status.loading ? <span className="spinner" /> : null}
              {status.loading ? 'Sending…' : 'Send Exchange Request'}
            </button>
          )}
          {status.ok && (
            <button className="btn btn-outline btn-block" onClick={onClose} style={{ marginTop: 10 }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modal   = { background: '#fff', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 540, width: '100%', position: 'relative', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' };
const closeBtn = { position: 'absolute', top: 14, right: 14, background: '#f5f5f5', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' };
const topRow   = { display: 'flex', gap: 18, marginBottom: 18 };
const infoCol  = { flex: 1, paddingTop: 4 };
const subjectLabel = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 };
const titleStyle   = { fontSize: 19, fontWeight: 700, color: '#111', letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 3 };
const authorStyle  = { fontSize: 13, color: 'var(--muted)', marginBottom: 10 };
const sellerRow    = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' };
const sellerAvatar = { width: 28, height: 28, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 };
const descBlock    = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 13px', marginBottom: 18 };
const descLabel    = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 };
const requestSection = { borderTop: '1px solid var(--border)', paddingTop: 18 };
