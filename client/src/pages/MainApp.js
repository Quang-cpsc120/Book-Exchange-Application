import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BrowseBooks from '../components/BrowseBooks';
import PostBook from '../components/PostBook';
import ExchangeRequests from '../components/ExchangeRequests';
import ActivityFeed from '../components/ActivityFeed';

const TABS = [
  { id: 'browse',   label: 'Browse Books' },
  { id: 'post',     label: 'Sell / Post' },
  { id: 'requests', label: 'Requests' },
  { id: 'activity', label: 'Activity' },
];

export default function MainApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('browse');

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={s.root}>
      {/* ── Top header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoArea}>
            <span style={s.logoIcon}>📚</span>
            <span style={s.logoText}>Titus</span>
          </div>

          {/* Desktop nav */}
          <nav style={s.nav}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ ...s.navLink, ...(tab === t.id ? s.navLinkActive : {}) }}
              >
                {t.label}
                {tab === t.id && <span style={s.navDot} />}
              </button>
            ))}
          </nav>

          <div style={s.userArea}>
            <div style={s.userMeta}>
              <span style={s.userName}>{user?.fullName}</span>
              <span style={s.userSub}>{user?.department || user?.studentId}</span>
            </div>
            <div style={s.avatar}>{initials(user?.fullName)}</div>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile nav ── */}
      <nav style={s.mobileNav}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...s.mobileNavItem, ...(tab === t.id ? s.mobileNavActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Page content ── */}
      <main style={s.main}>
        <div style={s.container}>
          {tab === 'browse'   && <BrowseBooks />}
          {tab === 'post'     && <PostBook onPosted={() => setTab('browse')} />}
          {tab === 'requests' && <ExchangeRequests />}
          {tab === 'activity' && <ActivityFeed />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerBrand}>📚 Titus</span>
          <span style={s.footerText}>Student book exchange platform · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: 22,
    lineHeight: 1,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  navLink: {
    position: 'relative',
    padding: '6px 14px',
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--muted)',
    cursor: 'pointer',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font)',
    transition: 'var(--transition)',
    letterSpacing: '0.01em',
  },
  navLinkActive: {
    color: '#111',
    background: '#f5f5f5',
  },
  navDot: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#111',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: 1.3,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111',
  },
  userSub: {
    fontSize: 11,
    color: 'var(--muted)',
  },
  avatar: {
    width: 32,
    height: 32,
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
  mobileNav: {
    display: 'none',
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    padding: '0 12px',
    overflowX: 'auto',
  },
  mobileNavItem: {
    padding: '12px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--muted)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font)',
    transition: 'var(--transition)',
  },
  mobileNavActive: {
    color: '#111',
    borderBottomColor: '#111',
  },
  main: {
    flex: 1,
    padding: '32px 24px',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  footer: {
    background: '#fff',
    borderTop: '1px solid var(--border)',
    padding: '16px 24px',
  },
  footerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111',
  },
  footerText: {
    fontSize: 12,
    color: 'var(--muted)',
  },
};
