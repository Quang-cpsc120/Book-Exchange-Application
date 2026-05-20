import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Computer Science','Engineering','Mathematics','Physics','Chemistry','Biology','Economics','Literature','History','Other'];
const YEARS       = ['Freshman','Sophomore','Junior','Senior','Graduate'];

export default function AuthPage() {
  const { register, login } = useAuth();
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ fullName: '', studentId: '', email: '', password: '', department: '', year: '' });
  const [classInput, setClassInput] = useState('');
  const [classes, setClasses]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const addClass = () => {
    const val = classInput.trim().toUpperCase();
    if (!val || classes.includes(val)) return;
    setClasses([...classes, val]);
    setClassInput('');
  };

  const submit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ ...form, classes });
        setSuccess('Account created! Welcome to Titus.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); setClasses([]); setClassInput(''); };

  return (
    <div style={s.page}>
      {/* ── Left brand panel ── */}
      <div style={s.panel}>
        <div style={s.panelInner}>
          <div style={s.brandRow}>
            <span style={{ fontSize: 28 }}>📚</span>
            <span style={s.brandName}>Titus</span>
          </div>
          <h2 style={s.panelHeading}>Trade textbooks.<br />Save money.<br />Help others.</h2>
          <p style={s.panelSub}>The student marketplace for exchanging university textbooks with fellow students.</p>
          <div style={s.features}>
            {[
              { icon: '🔍', text: 'Personalized book recommendations' },
              { icon: '📤', text: 'List your books in seconds' },
              { icon: '🤝', text: 'Agree on exchanges directly' },
              { icon: '🎓', text: 'Matched to your major & courses' },
            ].map(f => (
              <div key={f.text} style={s.featureRow}>
                <div style={s.featureIcon}>{f.icon}</div>
                <span style={s.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={s.formSide}>
        <div style={s.formWrap}>
          <h1 style={s.formHeading}>
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h1>
          <p style={s.formSub}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button style={s.switchLink} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <form onSubmit={submit} style={{ marginTop: 22 }}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label>Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handle} placeholder="Jane Smith" required />
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>Student ID *</label>
                    <input name="studentId" value={form.studentId} onChange={handle} placeholder="STU2024001" required />
                  </div>
                  <div className="field">
                    <label>Year</label>
                    <select name="year" value={form.year} onChange={handle}>
                      <option value="">Select…</option>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Department / Major</label>
                  <select name="department" value={form.department} onChange={handle}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                {/* Classes */}
                <div className="field">
                  <label>Classes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(for recommendations)</span></label>
                  <div style={s.classRow}>
                    <input
                      style={s.classInput}
                      value={classInput}
                      onChange={e => setClassInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addClass(); } }}
                      placeholder="e.g. CPSC 120"
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={addClass}>Add</button>
                  </div>
                  {classes.length > 0 && (
                    <div style={s.classTags}>
                      {classes.map(c => (
                        <span key={c} style={s.classTag}>
                          {c}
                          <button type="button" style={s.tagX} onClick={() => setClasses(classes.filter(x => x !== c))}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="field">
              <label>Email address *</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="student@university.edu" required />
            </div>
            <div className="field">
              <label>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} required minLength={6} />
            </div>

            {error   && <div className="alert alert-err">{error}</div>}
            {success && <div className="alert alert-ok">{success}</div>}

            <button className="btn btn-cta btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 18 }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p style={s.terms}>By continuing you agree to Titus's Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { display: 'flex', minHeight: '100vh' },
  panel:      {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, var(--blue-dark) 0%, var(--blue) 50%, #1a56c8 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 48px',
    position: 'relative', overflow: 'hidden',
  },
  panelInner: { maxWidth: 380, color: '#fff', position: 'relative', zIndex: 1 },
  brandRow:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
  brandName:  { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" },
  panelHeading: { fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 14 },
  panelSub:   { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 },
  features:   { display: 'flex', flexDirection: 'column', gap: 12 },
  featureRow: { display: 'flex', alignItems: 'center', gap: 12 },
  featureIcon:{ fontSize: 16, width: 36, height: 36, background: 'rgba(255,255,255,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText:{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 },
  formSide:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: 'var(--bg)', overflowY: 'auto' },
  formWrap:   { width: '100%', maxWidth: 420, background: '#fff', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)', border: '1.5px solid var(--border)' },
  formHeading:{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 },
  formSub:    { fontSize: 14, color: 'var(--muted)' },
  switchLink: { background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'underline', padding: 0, fontFamily: "'Inter', sans-serif" },
  classRow:   { display: 'flex', gap: 8, marginBottom: 8 },
  classInput: { flex: 1, padding: '9px 12px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', color: 'var(--text)' },
  classTags:  { display: 'flex', flexWrap: 'wrap', gap: 6 },
  classTag:   { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px 3px 10px', borderRadius: 20 },
  tagX:       { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, fontFamily: 'var(--font)' },
  terms:      { marginTop: 18, fontSize: 11, color: 'var(--muted2)', lineHeight: 1.6 },
};
