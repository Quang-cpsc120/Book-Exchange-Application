import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../context/MessagesContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import useIsMobile from '../hooks/useIsMobile';

export default function MessagesModal() {
  const { isOpen, closeMessages, activeConvId, setActiveConvId, refreshUnread } = useMessages();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [convs,       setConvs]       = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const endRef = useRef(null);

  const activeConv  = convs.find(c => c._id === activeConvId);
  const otherUser   = activeConv?.participants?.find(p => p._id !== user?._id);

  const fetchConvs = async () => {
    setLoadingConvs(true);
    try {
      const res = await api.get('/messages');
      setConvs(res.data);
    } catch {} finally { setLoadingConvs(false); }
  };

  const fetchMessages = async (convId) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data.messages);
      api.patch(`/messages/${convId}/read`).then(refreshUnread).catch(() => {});
    } catch {} finally { setLoadingMsgs(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchConvs();
  }, [isOpen]);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    fetchMessages(activeConvId);
    const id = setInterval(() => fetchMessages(activeConvId), 5000);
    return () => clearInterval(id);
  }, [activeConvId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;
    setSending(true);
    try {
      await api.post(`/messages/${activeConvId}`, { text });
      setText('');
      await fetchMessages(activeConvId);
      fetchConvs();
    } catch {} finally { setSending(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) closeMessages(); }}>
      <div style={{ ...s.panel, width: isMobile ? '100%' : 380, borderRadius: isMobile ? '16px 16px 0 0' : 0, maxHeight: isMobile ? '90vh' : '100vh', marginTop: isMobile ? 'auto' : 0 }}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.headerTitle}>Messages</span>
          <button style={s.closeBtn} onClick={closeMessages}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        <div style={s.body}>
          {/* Conversation list */}
          {!activeConvId && (
            <div style={s.convList}>
              {loadingConvs ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner spinner-dark" style={{ width: 22, height: 22, margin: 'auto' }} />
                </div>
              ) : convs.length === 0 ? (
                <div style={s.emptyMsg}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  <p>No messages yet.</p>
                  <p style={{ marginTop: 4 }}>Find a book and click "Message Seller" to start!</p>
                </div>
              ) : convs.map(conv => {
                const other = conv.participants?.find(p => p._id !== user?._id);
                return (
                  <button key={conv._id} style={s.convItem} onClick={() => setActiveConvId(conv._id)}>
                    <div style={s.convAvatar}>{(other?.fullName || '?')[0].toUpperCase()}</div>
                    <div style={s.convMeta}>
                      <div style={s.convName}>{other?.fullName || 'Unknown'}</div>
                      {conv.book && <div style={s.convBook}>re: {conv.book.title}</div>}
                      {conv.lastMessage && <div style={s.convLast}>{conv.lastMessage}</div>}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 4l4 4-4 4"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {/* Message thread */}
          {activeConvId && (
            <div style={s.thread}>
              <div style={s.threadHeader}>
                <button style={s.backBtn} onClick={() => { setActiveConvId(null); fetchConvs(); }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M10 12L6 8l4-4"/>
                  </svg>
                </button>
                <div>
                  <div style={s.threadName}>{otherUser?.fullName || '…'}</div>
                  {activeConv?.book && <div style={s.threadBook}>re: {activeConv.book.title}</div>}
                </div>
              </div>

              <div style={s.msgList}>
                {loadingMsgs && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <div className="spinner spinner-dark" style={{ width: 20, height: 20, margin: 'auto' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>
                    No messages yet — say hi!
                  </div>
                ) : messages.map(msg => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <div key={msg._id} style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}>
                      <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                        {msg.text}
                      </div>
                      <div style={s.msgTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form style={s.sendRow} onSubmit={send}>
                <input
                  style={s.sendInput}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !text.trim()} style={{ flexShrink: 0 }}>
                  {sending
                    ? <span className="spinner" style={{ width: 13, height: 13 }} />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                  }
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' },
  panel:       { background: '#fff', width: 380, maxWidth: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 28px rgba(0,0,0,0.14)', overflow: 'hidden' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  closeBtn:    { background: '#f0f2f8', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' },
  body:        { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  convList:    { flex: 1, overflowY: 'auto' },
  emptyMsg:    { textAlign: 'center', padding: '48px 24px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 },
  convItem:    { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 18px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'background .12s' },
  convAvatar:  { width: 38, height: 38, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 },
  convMeta:    { flex: 1, minWidth: 0 },
  convName:    { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  convBook:    { fontSize: 11, color: 'var(--blue)', fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convLast:    { fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  thread:      { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  threadHeader:{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  backBtn:     { background: '#f0f2f8', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  threadName:  { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  threadBook:  { fontSize: 11, color: 'var(--muted)', marginTop: 1 },
  msgList:     { flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  msgRow:      { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  msgRowMe:    { alignItems: 'flex-end' },
  bubble:      { maxWidth: '80%', padding: '8px 12px', borderRadius: 16, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleThem:  { background: '#f0f2f8', color: 'var(--text)', borderBottomLeftRadius: 4 },
  bubbleMe:    { background: 'var(--blue)', color: '#fff', borderBottomRightRadius: 4 },
  msgTime:     { fontSize: 10, color: 'var(--muted)', marginTop: 3 },
  sendRow:     { display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  sendInput:   { flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', color: 'var(--text)' },
};
