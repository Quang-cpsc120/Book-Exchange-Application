import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const MessagesContext = createContext();

export function MessagesProvider({ children }) {
  const { user } = useAuth();
  const [isOpen,       setIsOpen]       = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/messages/unread');
      setUnreadCount(res.data.count);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  const openMessages = (convId = null) => {
    setActiveConvId(convId);
    setIsOpen(true);
  };

  const closeMessages = () => {
    setIsOpen(false);
    setActiveConvId(null);
    fetchUnread();
  };

  const startChat = async (recipientId, bookId) => {
    try {
      const res = await api.post('/messages/start', { recipientId, bookId });
      openMessages(res.data._id);
    } catch (err) {
      console.error('Could not start chat', err);
    }
  };

  return (
    <MessagesContext.Provider value={{
      isOpen, openMessages, closeMessages,
      startChat, unreadCount,
      activeConvId, setActiveConvId,
      refreshUnread: fetchUnread,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => useContext(MessagesContext);
