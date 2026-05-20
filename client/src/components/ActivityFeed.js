import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ACTION_META = {
  signup:           { icon: '🎓', label: 'Signed up',       color: '#f0fdf4' },
  login:            { icon: '🔑', label: 'Signed in',       color: '#eff6ff' },
  post_book:        { icon: '📚', label: 'Posted a book',   color: '#fefce8' },
  view_book:        { icon: '👁',  label: 'Viewed a book',  color: '#f5f3ff' },
  delete_book:      { icon: '🗑️', label: 'Removed a book', color: '#fef2f2' },
  request_sent:     { icon: '📤', label: 'Request sent',    color: '#faf5ff' },
  request_accepted: { icon: '✅', label: 'Accepted',        color: '#f0fdf4' },
  request_declined: { icon: '❌', label: 'Declined',        color: '#fef2f2' },
};

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity')
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Books posted',   value: counts.post_book    || 0, icon: '📚', color: '#fefce8' },
    { label: 'Books viewed',   value: counts.view_book    || 0, icon: '👁',  color: '#f5f3ff' },
    { label: 'Requests sent',  value: counts.request_sent || 0, icon: '📤', color: '#faf5ff' },
    { label: 'Exchanges done', value: counts.request_accepted || 0, icon: '✅', color: '#f0fdf4' },
  ];

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
        <h1 style={s.heading}>My Activity</h1>
        <p style={s.subheading}>Your complete history on BookSwap</p>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map(stat => (
          <div key={stat.label} style={{ ...s.statCard, background: stat.color }}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={s.logHeader}>
          <h2 style={s.logHeading}>Activity log</h2>
          <span style={s.logCount}>{logs.length} event{logs.length !== 1 ? 's' : ''}</span>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="icon">📋</div>
            <p>No activity yet. Start browsing and posting books!</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const meta = ACTION_META[log.action] || { icon: '📌', label: log.action, color: '#f9fafb' };
              return (
                <div key={log._id} style={{ ...s.logRow, borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ ...s.logIcon, background: meta.color }}>{meta.icon}</div>
                  <div style={s.logContent}>
                    <div style={s.logDetail}>{log.detail}</div>
                    <div style={s.logTime}>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="badge badge-gray" style={{ flexShrink: 0 }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageTop: { marginBottom: 28 },
  heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'var(--muted)' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 16px',
    textAlign: 'center',
  },
  statIcon: { fontSize: 26, marginBottom: 8 },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.03em',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 500 },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 22px',
    borderBottom: '1px solid var(--border)',
  },
  logHeading: { fontSize: 15, fontWeight: 600, color: '#111' },
  logCount: { fontSize: 12, color: 'var(--muted)' },
  logRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '13px 22px',
    transition: 'background .15s',
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
    border: '1px solid rgba(0,0,0,0.05)',
  },
  logContent: { flex: 1, minWidth: 0 },
  logDetail: {
    fontSize: 13,
    color: '#111',
    fontWeight: 500,
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logTime: { fontSize: 11, color: 'var(--muted)' },
};
