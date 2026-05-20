import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Computer Science','Engineering','Mathematics','Physics','Chemistry','Biology','Economics','Literature','History','Other'];

export default function AuthPage() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', studentId: '', email: '', password: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
        setSuccess('Account created! Welcome to BookSwap.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.panel}>
        <div style={s.panelInner}>
          <div style={s.brandRow}>
            <div style={s.brandIcon}>📚</div>
            <span style={s.brandName}>BookSwap</span>
          </div>
          <h2 style={s.panelHeading}>Trade textbooks.<br />Save money. Help others.</h2>
          <p style={s.panelSub}>
            The student marketplace for buying, selling, and exchanging university textbooks with fellow students.
          </p>
          <div style={s.featureList}>
            {[
              { icon: '🔍', text: 'Browse books from your university' },
              { icon: '📤', text: 'List your books in seconds' },
              { icon: '🤝', text: 'Agree on exchanges directly' },
              { icon: '📋', text: 'Track all your activity' },
            ].map(f => (
              <div key={f.text} style={s.featureItem}>
                <span style={s.featureIcon}>{f.icon}</span>
                <span style={s.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.formPanel}>
        <div style={s.formCard}>
          <div style={s.mobileLogoRow}>
            <div style={s.brandIcon}>📚</div>
            <span style={{ ...s.brandName, color: '#111' }}>BookSwap</span>
          </div>

          <h1 style={s.formHeading}>
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h1>
          <p style={s.formSub}>
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              style={s.switchLink}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <form onSubmit={submit} style={{ marginTop: 24 }}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label>Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handle} placeholder="Jane Smith" required />
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>Student ID</label>
                    <input name="studentId" value={form.studentId} onChange={handle} placeholder="STU2024001" required />
                  </div>
                  <div className="field">
                    <label>Department</label>
                    <select name="department" value={form.department} onChange={handle}>
                      <option value="">Select…</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="field">
              <label>Email address</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="student@university.edu" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} required minLength={6} />
            </div>

            {error   && <div className="alert alert-err">{error}</div>}
            {success && <div className="alert alert-ok">{success}</div>}

            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 20 }}>
              {loading ? <span className="spinner" /> : null}
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p style={s.terms}>
            By continuing you agree to BookSwap's <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  panel: {
    flex: '0 0 42%',
    background: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 48px',
    '@media(max-width:768px)': { display: 'none' },
  },
  panelInner: {
    maxWidth: 380,
    color: '#fff',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  brandIcon: {
    fontSize: 28,
    lineHeight: 1,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
    fontFamily: "'Inter', sans-serif",
  },
  panelHeading: {
    fontSize: 32,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    marginBottom: 16,
  },
  panelSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7,
    marginBottom: 36,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 18,
    width: 36,
    height: 36,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  formPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 32px',
    background: '#fff',
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
  },
  mobileLogoRow: {
    display: 'none',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  formHeading: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.02em',
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#111',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    textDecoration: 'underline',
    padding: 0,
    fontFamily: "'Inter', sans-serif",
  },
  terms: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    lineHeight: 1.6,
  },
};
