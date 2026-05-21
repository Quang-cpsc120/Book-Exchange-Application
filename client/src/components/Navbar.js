import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import PostBookModal from './PostBookModal';
import Logo from './Logo';
import useIsMobile from '../hooks/useIsMobile';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openMessages, unreadCount } = useMessages();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postOpen, setPostOpen]           = useState(false);
  const [pendingCount, setPendingCount]   = useState(0);
  const dropRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get('/api/requests');
        const pending = (res.data || []).filter(
          r => r.bookOwner?._id === user?._id && r.status === 'pending'
        );
        setPendingCount(pending.length);
      } catch {}
    };
    fetchPending();
    const id = setInterval(fetchPending, 30000);
    return () => clearInterval(id);
  }, []);

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
      <header style={s.header}>
        <div style={{ ...s.inner, padding: isMobile ? '0 16px' : '0 28px' }}>
          {/* Logo */}
          <Link to="/" style={s.logo}>
            <Logo size={34} />
            <span style={s.logoText}>Titus</span>
          </Link>

          {isMobile ? (
            /* ── Mobile right side ── */
            <div style={s.mobileRight}>
              {/* Messages icon */}
              <div style={s.msgWrap}>
                <button style={s.msgBtn} onClick={() => openMessages()} title="Messages">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </button>
                {unreadCount > 0 && (
                  <span style={s.msgBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>

              {/* Hamburger */}
              <button
                style={s.hamburger}
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                  </svg>
                )}
                {(pendingCount > 0) && !mobileMenuOpen && (
                  <span style={{ ...s.msgBadge, top: -3, right: -3 }}>{pendingCount}</span>
                )}
              </button>
            </div>
          ) : (
            /* ── Desktop nav ── */
            <>
              <nav style={s.nav}>
                <Link to="/" style={{ ...s.navLink, ...(isActive('/') ? s.navActive : {}) }}>
                  Home
                </Link>
                <Link to="/browse" style={{ ...s.navLink, ...(isActive('/browse') ? s.navActive : {}) }}>
                  Browse Books
                </Link>
              </nav>

              <div style={s.right}>
                <button className="btn btn-cta btn-sm" onClick={() => setPostOpen(true)}>
                  + Post a Book
                </button>

                {/* Messages icon */}
                <div style={s.msgWrap}>
                  <button style={s.msgBtn} onClick={() => openMessages()} title="Messages">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  {unreadCount > 0 && (
                    <span style={s.msgBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </div>

                {/* User dropdown */}
                <div style={s.dropWrap} ref={dropRef}>
                  <button style={s.avatarBtn} onClick={() => setDropdownOpen(v => !v)}>
                    <div style={s.avatar}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
                      </svg>
                    </div>
                    <div style={s.userMeta}>
                      <span style={s.userName}>{user?.fullName}</span>
                      <span style={s.userSub}>{user?.department || user?.studentId}</span>
                    </div>
                    <svg style={{ ...s.chevron, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div style={s.dropdown}>
                      <div style={s.dropHeader}>
                        <div style={{ ...s.avatar, width: 40, height: 40, fontSize: 15, background: 'var(--blue)' }}>{initials(user?.fullName)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user?.studentId}</div>
                        </div>
                      </div>
                      <div style={s.dropDivider} />
                      <Link to="/profile" style={s.dropItem} onClick={() => setDropdownOpen(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        My Profile
                      </Link>
                      <Link to="/profile?tab=listings" style={s.dropItem} onClick={() => setDropdownOpen(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                        My Listings
                      </Link>
                      <Link to="/profile?tab=requests" style={s.dropItem} onClick={() => setDropdownOpen(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        Exchange Requests
                        {pendingCount > 0 && (
                          <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                      {user?.isAdmin && (
                        <>
                          <div style={s.dropDivider} />
                          <Link to="/admin" style={{ ...s.dropItem, color: '#6366f1' }} onClick={() => setDropdownOpen(false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                            Admin Dashboard
                          </Link>
                        </>
                      )}
                      <div style={s.dropDivider} />
                      <button style={{ ...s.dropItem, color: 'var(--danger)', width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left' }} onClick={logout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Mobile slide-down menu ── */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="mobile-backdrop visible"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div style={s.mobileMenu}>
            {/* User info */}
            <div style={s.mobileUserRow}>
              <div style={{ ...s.avatar, width: 40, height: 40, fontSize: 15, background: 'var(--blue)', flexShrink: 0 }}>{initials(user?.fullName)}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{user?.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.studentId}</div>
              </div>
            </div>

            <div style={s.mobileDivider} />

            <Link to="/" style={s.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </Link>
            <Link to="/browse" style={s.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Browse Books
            </Link>
            <Link to="/profile" style={s.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              My Profile
            </Link>
            <Link to="/profile?tab=requests" style={s.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Exchange Requests
              {pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                  {pendingCount}
                </span>
              )}
            </Link>
            {user?.isAdmin && (
              <Link to="/admin" style={{ ...s.mobileLink, color: '#6366f1' }} onClick={() => setMobileMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                Admin Dashboard
              </Link>
            )}

            <div style={s.mobileDivider} />

            <button
              className="btn btn-cta btn-block"
              style={{ marginBottom: 10 }}
              onClick={() => { setMobileMenuOpen(false); setPostOpen(true); }}
            >
              + Post a Book
            </button>

            <button
              style={{ ...s.mobileLink, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', width: '100%', textAlign: 'left' }}
              onClick={() => { setMobileMenuOpen(false); logout(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign out
            </button>
          </div>
        </>
      )}

      <PostBookModal open={postOpen} onClose={() => setPostOpen(false)} />
    </>
  );
}

const s = {
  header: {
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 28,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoText: { fontSize: 16, fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.02em' },
  nav: { display: 'flex', alignItems: 'center', gap: 0, flex: 1 },
  navLink: {
    padding: '18px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--muted)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    transition: 'color .15s, border-color .15s',
    lineHeight: 1,
  },
  navActive: {
    color: 'var(--blue)',
    borderBottomColor: 'var(--blue)',
    fontWeight: 600,
  },
  right:   { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  mobileRight: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  msgWrap: { position: 'relative' },
  msgBtn:  { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 'var(--radius)', transition: 'color .15s, background .15s' },
  msgBadge:{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 4px', minWidth: 16, textAlign: 'center', lineHeight: '14px' },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text)', display: 'flex', alignItems: 'center',
    padding: '6px 8px', borderRadius: 'var(--radius)',
    position: 'relative',
  },
  dropWrap: { position: 'relative' },
  avatarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '4px 6px',
    cursor: 'pointer',
    transition: 'background .15s',
    fontFamily: 'var(--font)',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--blue)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    flexShrink: 0,
  },
  userMeta: { display: 'flex', flexDirection: 'column', lineHeight: 1.3, textAlign: 'left' },
  userName: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  userSub:  { fontSize: 10, color: 'var(--muted)' },
  chevron:  { color: 'var(--muted)', transition: 'transform .2s', flexShrink: 0 },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    minWidth: 200,
    zIndex: 200,
    overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
  },
  dropDivider: { height: 1, background: 'var(--border)' },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '9px 14px',
    fontSize: 13,
    color: 'var(--text)',
    textDecoration: 'none',
    transition: 'background .12s',
    fontWeight: 500,
  },
  /* Mobile menu */
  mobileMenu: {
    position: 'fixed',
    top: 56,
    left: 0,
    right: 0,
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    zIndex: 200,
    padding: '12px 16px 20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    animation: 'fadeIn .18s ease',
  },
  mobileUserRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 0 12px',
  },
  mobileDivider: { height: 1, background: 'var(--border)', margin: '8px 0' },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 4px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text)',
    textDecoration: 'none',
    borderRadius: 'var(--radius)',
  },
};
