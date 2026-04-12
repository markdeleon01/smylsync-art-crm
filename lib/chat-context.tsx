'use client';

import { createContext, useContext } from 'react';

export interface ChatSidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  isHydrated: boolean;
}

export const ChatSidebarContext = createContext<ChatSidebarContextValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
  isHydrated: false
});

export function useChatSidebar() {
  return useContext(ChatSidebarContext);
}
