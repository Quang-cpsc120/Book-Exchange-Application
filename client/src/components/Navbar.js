import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostBookModal from './PostBookModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const dropRef = useRef(null);

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

  return (
    <>
      <header style={s.header}>
        <div style={s.inner}>
          {/* Logo */}
          <Link to="/" style={s.logo}>
            <span style={s.logoIcon}>📚</span>
            <span style={s.logoText}>BookSwap</span>
          </Link>

          {/* Nav links */}
          <nav style={s.nav}>
            <Link to="/" style={{ ...s.navLink, ...(isActive('/') ? s.navActive : {}) }}>
              Home
            </Link>
            <Link to="/browse" style={{ ...s.navLink, ...(isActive('/browse') ? s.navActive : {}) }}>
              Browse Books
            </Link>
          </nav>

          {/* Right side */}
          <div style={s.right}>
            <button className="btn btn-cta btn-sm" onClick={() => setPostOpen(true)}>
              + Post a Book
            </button>

            {/* User dropdown */}
            <div style={s.dropWrap} ref={dropRef}>
              <button style={s.avatarBtn} onClick={() => setDropdownOpen(v => !v)}>
                <div style={s.avatar}>{initials(user?.fullName)}</div>
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
        </div>
      </header>

      <PostBookModal open={postOpen} onClose={() => setPostOpen(false)} />
    </>
  );
}

const s = {
  header: {
    background: 'var(--blue)',
    borderBottom: 'none',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(0,61,165,0.25)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 62,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: { fontSize: 22, lineHeight: 1 },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' },
  nav: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  navLink: {
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    transition: 'var(--transition)',
  },
  navActive: { color: '#fff', background: 'rgba(255,255,255,0.15)' },
  right: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' },
  dropWrap: { position: 'relative' },
  avatarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.12)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: 'var(--radius)',
    padding: '5px 10px 5px 6px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'var(--font)',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--orange)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    flexShrink: 0,
  },
  userMeta: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, textAlign: 'left' },
  userName: { fontSize: 12, fontWeight: 700, color: '#fff' },
  userSub:  { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  chevron:  { color: 'rgba(255,255,255,0.6)', transition: 'transform .2s', flexShrink: 0 },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: 210,
    zIndex: 200,
    overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 14px 12px',
    background: 'var(--blue-xlight)',
  },
  dropDivider: { height: 1, background: 'var(--border)', margin: '0' },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--text)',
    textDecoration: 'none',
    transition: 'background .15s',
    fontWeight: 500,
  },
};
