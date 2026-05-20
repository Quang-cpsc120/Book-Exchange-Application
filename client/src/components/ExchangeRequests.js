import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ExchangeRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/requests/${id}`, { status });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating request');
    } finally { setUpdating(''); }
  };

  const incoming = requests.filter(r => r.bookOwner?._id === user?._id && r.status === 'pending');
  const outgoing = requests.filter(r => r.requester?._id === user?._id);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '72px 0' }}>
        <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: 'auto' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={s.pageTop}>
        <h1 style={s.heading}>Exchange Requests</h1>
        <p style={s.subheading}>Manage incoming and outgoing exchange agreements</p>
      </div>

      {/* Incoming */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Incoming requests</h2>
          {incoming.length > 0 && (
            <span className="badge badge-amber">{incoming.length} pending</span>
          )}
        </div>

        {incoming.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 0' }}>
            <div className="icon">📬</div>
            <p>No pending incoming requests.</p>
          </div>
        ) : (
          incoming.map(r => (
            <div key={r._id} style={s.reqCard}>
              <div style={s.reqAccent} />
              <div style={s.reqBody}>
                <div style={s.reqBookTitle}>{r.book?.title}</div>
                <div style={s.reqLine}>
                  <strong>{r.requester?.fullName}</strong>
                  <span style={s.reqId}> @{r.requester?.studentId}</span>
                  {' '}wants to exchange
                </div>
                <div style={s.reqLine}>
                  Offering: <strong>"{r.offerBook}"</strong>
                </div>
                {r.message && (
                  <div style={s.reqMessage}>"{r.message}"</div>
                )}
                <div style={s.reqTime}>{timeAgo(r.createdAt)}</div>
              </div>
              <div style={s.reqActions}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={updating === r._id}
                  onClick={() => handle(r._id, 'accepted')}
                >
                  {updating === r._id ? <span className="spinner" /> : null}
                  Accept
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={updating === r._id}
                  onClick={() => handle(r._id, 'declined')}
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Outgoing */}
      <section>
        <div style={s.sectionHeader}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>My outgoing requests</h2>
          <span style={s.countNote}>{outgoing.length} total</span>
        </div>

        {outgoing.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 0' }}>
            <div className="icon">📤</div>
            <p>You haven't sent any exchange requests yet.</p>
          </div>
        ) : (
          outgoing.map(r => (
            <div key={r._id} style={{ ...s.reqCard, alignItems: 'center' }}>
              <div style={s.reqAccentStatus(r.status)} />
              <div style={{ ...s.reqBody, flex: 1 }}>
                <div style={s.reqBookTitle}>{r.book?.title}</div>
                <div style={s.reqLine}>
                  You offered: <strong>"{r.offerBook}"</strong>
                </div>
                <div style={s.reqLine}>
                  Owner: {r.bookOwner?.fullName}
                  <span style={s.reqId}> @{r.bookOwner?.studentId}</span>
                </div>
                {r.message && <div style={s.reqMessage}>"{r.message}"</div>}
                <div style={s.reqTime}>{timeAgo(r.createdAt)}</div>
              </div>
              <div style={s.statusCol}>
                <StatusBadge status={r.status} />
                {r.status === 'accepted' && (
                  <div style={s.acceptedNote}>Exchange agreed!</div>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  'badge-amber',
    accepted: 'badge-green',
    declined: 'badge-red',
    completed:'badge-blue',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const s = {
  pageTop: { marginBottom: 28 },
  heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'var(--muted)' },
  section: { marginBottom: 40 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  countNote: { fontSize: 12, color: 'var(--muted)' },
  reqCard: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0',
    marginBottom: 10,
    display: 'flex',
    gap: 0,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  reqAccent: {
    width: 4,
    alignSelf: 'stretch',
    background: 'var(--warn)',
    flexShrink: 0,
    minHeight: 80,
  },
  reqAccentStatus: (status) => ({
    width: 4,
    alignSelf: 'stretch',
    background: status === 'accepted' ? 'var(--success)' : status === 'declined' ? 'var(--danger)' : '#ccc',
    flexShrink: 0,
    minHeight: 80,
  }),
  reqBody: {
    flex: 1,
    padding: '14px 16px',
    minWidth: 0,
  },
  reqBookTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111',
    marginBottom: 6,
    letterSpacing: '-0.01em',
  },
  reqLine: {
    fontSize: 13,
    color: 'var(--muted)',
    marginBottom: 3,
    lineHeight: 1.5,
  },
  reqId: { color: 'var(--muted2)', fontSize: 12 },
  reqMessage: {
    fontSize: 13,
    color: 'var(--muted)',
    fontStyle: 'italic',
    marginTop: 6,
    padding: '8px 10px',
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    borderLeft: '3px solid var(--border)',
  },
  reqTime: { fontSize: 11, color: 'var(--muted2)', marginTop: 8 },
  reqActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    flexShrink: 0,
  },
  statusCol: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  acceptedNote: {
    fontSize: 11,
    color: 'var(--success)',
    fontWeight: 600,
  },
};
