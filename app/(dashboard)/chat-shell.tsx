'use client';

import { useState, useEffect } from 'react';
import { ChatSidebarContext } from '@/lib/chat-context';

const OPEN_STATE_KEY = 'art-chatbot-open';

export default function ChatShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(OPEN_STATE_KEY);
    if (saved) {
      try {
        setIsOpen(JSON.parse(saved));
      } catch {
        // ignore malformed stored value
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(OPEN_STATE_KEY, JSON.stringify(isOpen));
    }
  }, [isOpen, isHydrated]);

  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  return (
    <ChatSidebarContext.Provider value={{ isOpen, toggle, close, isHydrated }}>
      <div
        className={`flex flex-col sm:gap-4 sm:py-4 sm:pl-14 transition-[margin-right] duration-300 ease-in-out${isHydrated && isOpen ? ' sm:mr-96' : ''}`}
      >
        {children}
      </div>
    </ChatSidebarContext.Provider>
  );
}
