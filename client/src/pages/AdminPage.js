import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const TABS = ['Overview', 'Users', 'Search Analytics', 'Exchanges', 'Reports'];
const PIE_COLORS = ['#111', '#555', '#888', '#aaa', '#ccc', '#e5e5e5'];

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();
const ago = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={sc.card}>
      <div style={{ ...sc.accent, background: accent || '#111' }} />
      <div style={sc.body}>
        <div style={sc.value}>{fmt(value)}</div>
        <div style={sc.label}>{label}</div>
        {sub && <div style={sc.sub}>{sub}</div>}
      </div>
    </div>
  );
}
const sc = {
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', overflow: 'hidden' },
  accent: { width: 4, flexShrink: 0 },
  body:   { padding: '16px 20px', flex: 1 },
  value:  { fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  label:  { fontSize: 12, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' },
  sub:    { fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: 4 },
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {title && <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#111' }}>{title}</div>}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ── OverviewTab ───────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  if (!data) return <Skeleton />;
  const { totals, trends, dailyActivity } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        <StatCard label="Total Users" value={totals.users} sub={`+${trends.newUsersThisWeek} this week`} accent="#111" />
        <StatCard label="Books Listed" value={totals.books} sub={`+${trends.newBooksThisWeek} this week`} accent="#555" />
        <StatCard label="Exchanges" value={totals.exchanges} accent="#888" />
        <StatCard label="Pending" value={totals.pendingExchanges} accent="#f59e0b" />
        <StatCard label="Completed" value={totals.completedExchanges} accent="#22c55e" />
        <StatCard label="Searches" value={totals.searches} accent="#6366f1" />
      </div>

      <Section title="Daily Activity (last 14 days)">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyActivity} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [v, 'actions']} labelFormatter={d => `Date: ${d}`} />
            <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

// ── UsersTab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`/api/admin/users?q=${encodeURIComponent(q)}&sort=${sort}`);
      setUsers(res.data);
    } catch {}
  }, [q, sort]);

  useEffect(() => { load(); }, [load]);

  const openUser = async (u) => {
    setSelected(u);
    setActivity(null);
    try {
      const res = await axios.get(`/api/admin/users/${u._id}/activity`);
      setActivity(res.data);
    } catch {}
  };

  if (selected) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => setSelected(null)} style={backBtn}>← Back to users</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Section title="User Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Name', selected.fullName], ['Student ID', selected.studentId], ['Email', selected.email],
              ['Department', selected.department || '—'], ['Year', selected.year || '—'],
              ['Books Posted', selected.booksPosted], ['Exchanges', selected.exchangesCompleted],
              ['Admin', selected.isAdmin ? 'Yes' : 'No'], ['Last Login', ago(selected.lastLogin)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
            {selected.classes?.length > 0 && (
              <div style={{ fontSize: 13 }}>
                <div style={{ color: 'var(--muted)', fontWeight: 500, marginBottom: 6 }}>Classes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.classes.map(c => <span key={c} style={chip}>{c}</span>)}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Recent Searches">
          {!activity ? <Skeleton /> : activity.searches.length === 0 ? <Empty text="No searches yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activity.searches.slice(0, 15).map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{s.query || '(all books)'}</span>
                    {s.subject && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>· {s.subject}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, color: 'var(--muted)' }}>
                    <span>{s.resultsCount} results</span>
                    <span>{ago(s.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Activity Log">
        {!activity ? <Skeleton /> : activity.logs.length === 0 ? <Empty text="No activity yet" /> : (
          <table style={tbl.table}>
            <thead><tr>{['Action', 'Detail', 'Book', 'When'].map(h => <th key={h} style={tbl.th}>{h}</th>)}</tr></thead>
            <tbody>
              {activity.logs.map(l => (
                <tr key={l._id} style={tbl.tr}>
                  <td style={tbl.td}><span style={actionBadge(l.action)}>{l.action.replace('_', ' ')}</span></td>
                  <td style={{ ...tbl.td, maxWidth: 300 }}>{l.detail}</td>
                  <td style={tbl.td}>{l.relatedBook?.title || '—'}</td>
                  <td style={{ ...tbl.td, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ago(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          style={{ ...searchInput, flex: 1 }}
          placeholder="Search by name, email, ID, department…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select style={selectInput} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="books">Most Books</option>
          <option value="exchanges">Most Exchanges</option>
        </select>
      </div>

      {!users ? <Skeleton /> : (
        <Section>
          <table style={tbl.table}>
            <thead>
              <tr>{['Name', 'ID', 'Department', 'Year', 'Books', 'Exchanges', 'Admin', 'Last Login', ''].map(h =>
                <th key={h} style={tbl.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={tbl.tr}>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ ...tbl.td, color: 'var(--muted)' }}>{u.studentId}</td>
                  <td style={tbl.td}>{u.department || '—'}</td>
                  <td style={tbl.td}>{u.year || '—'}</td>
                  <td style={{ ...tbl.td, textAlign: 'center' }}>{u.booksPosted}</td>
                  <td style={{ ...tbl.td, textAlign: 'center' }}>{u.exchangesCompleted}</td>
                  <td style={{ ...tbl.td, textAlign: 'center' }}>{u.isAdmin ? <span style={adminBadge}>Admin</span> : '—'}</td>
                  <td style={{ ...tbl.td, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ago(u.lastLogin)}</td>
                  <td style={tbl.td}>
                    <button onClick={() => openUser(u)} style={viewBtn}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>{users.length} users total</div>
        </Section>
      )}
    </div>
  );
}

// ── SearchTab ─────────────────────────────────────────────────────────────────
function SearchTab({ data }) {
  if (!data) return <Skeleton />;
  const { recent, topTerms, topSubjects, zeroResults } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Top Search Terms">
          {topTerms.length === 0 ? <Empty text="No searches yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topTerms.map((t, i) => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11, width: 16 }}>{i + 1}</span>
                    <span style={{ fontWeight: 600 }}>{t._id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, color: 'var(--muted)', fontSize: 12 }}>
                    <span>{t.count}x</span>
                    <span>{Math.round(t.avgResults)} avg results</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Demand Gaps (Zero-Result Searches)">
          {zeroResults.length === 0
            ? <Empty text="No zero-result searches — great inventory!" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Students searched these but found nothing — consider encouraging listings:</p>
                {zeroResults.map((z) => (
                  <div key={z._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>{z._id}</span>
                    <span style={{ color: 'var(--muted)' }}>{z.count} searches</span>
                  </div>
                ))}
              </div>
            )
          }
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Section title="Searches by Subject">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSubjects.slice(0, 10)} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#111" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Recent Searches">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
            {recent.slice(0, 30).map((s) => (
              <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{s.query || '(browse)'}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: 4 }}>{s.user?.fullName}</span>
                </div>
                <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>{s.resultsCount}r · {ago(s.createdAt)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── ExchangesTab ──────────────────────────────────────────────────────────────
function ExchangesTab({ data }) {
  if (!data) return <Skeleton />;
  const { exchanges, byDept, bySubject } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Completed Exchanges by Department">
          {byDept.length === 0 ? <Empty text="No completed exchanges yet" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDept} layout="vertical" margin={{ top: 4, right: 16, left: 70, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={65} />
                <Tooltip />
                <Bar dataKey="count" fill="#111" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Completed Exchanges by Subject">
          {bySubject.length === 0 ? <Empty text="No data yet" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bySubject.slice(0, 6)} dataKey="count" nameKey="_id" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {bySubject.slice(0, 6).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <Section title={`All Exchange Requests (${exchanges.length})`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl.table}>
            <thead>
              <tr>{['Book', 'Requester', 'Owner', 'Status', 'Date'].map(h => <th key={h} style={tbl.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {exchanges.map(e => (
                <tr key={e._id} style={tbl.tr}>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>{e.book?.title || '—'}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{e.book?.subject}</span></td>
                  <td style={tbl.td}>{e.requester?.fullName}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{e.requester?.department}</span></td>
                  <td style={tbl.td}>{e.bookOwner?.fullName}</td>
                  <td style={tbl.td}><span style={statusBadge(e.status)}>{e.status}</span></td>
                  <td style={{ ...tbl.td, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ago(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── ReportsTab ────────────────────────────────────────────────────────────────
function ReportsTab({ data }) {
  if (!data) return <Skeleton />;
  const { booksBySubject, booksByCondition, usersByDept, usersByYear, monthlyExchanges, topBooks, topUsers } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Monthly exchange volume */}
      <Section title="Monthly Exchange Volume (last 6 months)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyExchanges} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#111" name="Total" radius={[3, 3, 0, 0]} />
            <Bar dataKey="accepted" fill="#22c55e" name="Accepted" radius={[3, 3, 0, 0]} />
            <Bar dataKey="declined" fill="#ef4444" name="Declined" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Books by Subject">
          {booksBySubject.length === 0 ? <Empty text="No books yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={booksBySubject.slice(0, 8)} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#555" name="Total" radius={[3, 3, 0, 0]} />
                <Bar dataKey="available" fill="#22c55e" name="Available" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Books by Condition">
          {booksByCondition.length === 0 ? <Empty text="No books yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={booksByCondition} dataKey="count" nameKey="_id" outerRadius={80} label={({ _id }) => _id}>
                  {booksByCondition.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Users by Department">
          {usersByDept.length === 0 ? <Empty text="No users yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={usersByDept.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="count" fill="#111" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Users by Year">
          {usersByYear.length === 0 ? <Empty text="No data yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={usersByYear} dataKey="count" nameKey="_id" outerRadius={80} label={({ _id }) => _id}>
                  {usersByYear.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Top 10 Most Viewed Books">
          <table style={tbl.table}>
            <thead><tr>{['Title', 'Author', 'Subject', 'Views', 'Owner'].map(h => <th key={h} style={tbl.th}>{h}</th>)}</tr></thead>
            <tbody>
              {topBooks.map((b, i) => (
                <tr key={b._id} style={tbl.tr}>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11, marginRight: 6 }}>{i + 1}</span>{b.title}
                  </td>
                  <td style={tbl.td}>{b.author}</td>
                  <td style={tbl.td}>{b.subject}</td>
                  <td style={{ ...tbl.td, textAlign: 'center', fontWeight: 600 }}>{b.views}</td>
                  <td style={tbl.td}>{b.owner?.fullName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Top 10 Most Active Users">
          <table style={tbl.table}>
            <thead><tr>{['Name', 'Department', 'ID', 'Actions'].map(h => <th key={h} style={tbl.th}>{h}</th>)}</tr></thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u._id} style={tbl.tr}>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11, marginRight: 6 }}>{i + 1}</span>{u.fullName}
                  </td>
                  <td style={tbl.td}>{u.department}</td>
                  <td style={{ ...tbl.td, color: 'var(--muted)' }}>{u.studentId}</td>
                  <td style={{ ...tbl.td, textAlign: 'center', fontWeight: 700 }}>{u.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

// ── Utility components ────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[100, 80, 90, 70].map((w, i) => (
        <div key={i} style={{ height: 14, background: '#f0f0f0', borderRadius: 4, width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>{text}</div>;
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const tbl = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  tr: {},
};
const chip = { display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#f5f5f5', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600 };
const adminBadge = { display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#111', color: '#fff', fontSize: 10, fontWeight: 700 };
const backBtn = { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'var(--font)', fontWeight: 500 };
const viewBtn = { padding: '3px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 };
const searchInput = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none' };
const selectInput = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font)', background: '#fff', cursor: 'pointer' };

const actionColors = { view_book: '#6366f1', post_book: '#22c55e', delete_book: '#ef4444', login: '#f59e0b', request_exchange: '#3b82f6', accept_exchange: '#22c55e', decline_exchange: '#ef4444' };
const actionBadge = (action) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  background: (actionColors[action] || '#888') + '20',
  color: actionColors[action] || '#888',
  border: `1px solid ${(actionColors[action] || '#888')}40`,
});
const statusColors = { pending: '#f59e0b', accepted: '#22c55e', declined: '#ef4444', cancelled: '#888' };
const statusBadge = (status) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  background: (statusColors[status] || '#888') + '20',
  color: statusColors[status] || '#888',
  border: `1px solid ${(statusColors[status] || '#888')}40`,
  textTransform: 'capitalize',
});

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const [overview, setOverview] = useState(null);
  const [searches, setSearches] = useState(null);
  const [exchanges, setExchanges] = useState(null);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    if (tab === 0 && !overview) axios.get('/api/admin/overview').then(r => setOverview(r.data)).catch(() => {});
    if (tab === 2 && !searches) axios.get('/api/admin/searches').then(r => setSearches(r.data)).catch(() => {});
    if (tab === 3 && !exchanges) axios.get('/api/admin/exchanges').then(r => setExchanges(r.data)).catch(() => {});
    if (tab === 4 && !reports) axios.get('/api/admin/reports').then(r => setReports(r.data)).catch(() => {});
  }, [tab]); // eslint-disable-line

  const refresh = () => {
    setOverview(null); setSearches(null); setExchanges(null); setReports(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>User activity, exchange history, and business reports</p>
        </div>
        <button onClick={refresh} style={{ ...viewBtn, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              color: tab === i ? '#111' : 'var(--muted)',
              borderBottom: tab === i ? '2px solid #111' : '2px solid transparent',
              marginBottom: -2,
              transition: 'color .15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <OverviewTab data={overview} />}
      {tab === 1 && <UsersTab />}
      {tab === 2 && <SearchTab data={searches} />}
      {tab === 3 && <ExchangesTab data={exchanges} />}
      {tab === 4 && <ReportsTab data={reports} />}
    </div>
  );
}
