'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, type Message } from '@/lib/hooks/useChat';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useChatSidebar } from '@/lib/chat-context';
import styles from './index.module.css';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

const CHATBOT_ORANGE = '#FFA500';
const CHATBOT_USER_BUBBLE = '#D9F8FF';
const STORAGE_KEY = 'art-chatbot-messages';

export default function ArtBot() {
  const { isOpen, toggle, isHydrated } = useChatSidebar();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    setMessages,
    toolsExecuted
  } = useChat({
    onError: (error) => {
      console.error('Chat error:', error);
    },
    initialMessages
  });

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persisted messages from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setInitialMessages(parsed);
          setMessages(parsed);
        } catch (e) {
          console.error('Failed to load persisted messages:', e);
        }
      }
    }
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const input = document.querySelector(
          '[data-chat-input]'
        ) as HTMLInputElement;
        input?.focus();
      }, 300); // wait for slide-in transition
    }
  }, [isOpen]);

  // Focus input when chatbot finishes responding
  useEffect(() => {
    if (isOpen && !isLoading) {
      setTimeout(() => {
        const input = document.querySelector(
          '[data-chat-input]'
        ) as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }, [isLoading, isOpen]);

  // Reload page after tool execution completes, and notify other components
  useEffect(() => {
    if (!isLoading && toolsExecuted && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      window.dispatchEvent(new CustomEvent('art:tools-executed'));
      const reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(reloadTimer);
    }
  }, [isLoading, toolsExecuted, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <>
      {/* Sliding panel: bottom sheet on mobile, sidebar on desktop */}
      <div
        className={`${styles.panel}${isHydrated && isOpen ? ` ${styles.panelOpen}` : ''}`}
        aria-hidden={!isOpen}
      >
        {/* Collapse chevron strip — desktop only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              className="hidden sm:flex items-center justify-center w-5 h-full bg-gray-100 hover:bg-gray-200 border-l border-t border-b border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-inset"
              style={{ color: CHATBOT_ORANGE }}
              aria-label="Collapse chat sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Collapse sidebar</TooltipContent>
        </Tooltip>

        {/* Panel */}
        <div className="flex-1 sm:flex-none sm:w-96 h-full bg-white shadow-2xl flex flex-col border-t border-gray-200 sm:border-t-0 sm:border-l">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white shrink-0"
            style={{ backgroundColor: CHATBOT_ORANGE }}
          >
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="ART" className="h-5 w-5 shrink-0" />
              <h2 className="font-semibold">Ask ART</h2>
            </div>
            <div className="flex items-center gap-1">
              {/* Minimize — mobile only */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggle}
                    className="sm:hidden p-1 hover:bg-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Minimize chat"
                  >
                    <ChevronDown size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Minimize</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-sm text-gray-500 mt-4">
                <p className="font-semibold mb-1">Welcome to ART</p>
                <p>Start a conversation to get help</p>
              </div>
            )}

            {messages
              .filter((message) => message.content.trim())
              .map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-lg text-sm"
                    style={
                      message.role === 'user'
                        ? {
                            backgroundColor: CHATBOT_USER_BUBBLE,
                            color: '#333'
                          }
                        : { backgroundColor: '#f3f4f6', color: '#111827' }
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-sm">
                  <div className="flex gap-1">
                    {[0, 100, 200].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          backgroundColor: CHATBOT_ORANGE,
                          animationDelay: `${delay}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">
                  <p>{error.message}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 p-3 shrink-0"
          >
            <div className="flex gap-2">
              <textarea
                data-chat-input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={`Type a message... \n\n(Shift+Enter for new line)`}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none disabled:opacity-60 resize-none"
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = CHATBOT_ORANGE)
                }
                onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                rows={3}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 text-white rounded text-sm font-medium focus:outline-none disabled:opacity-60"
                style={{ backgroundColor: CHATBOT_ORANGE }}
              >
                {isLoading ? '…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toggle button — only visible when sidebar is closed */}
      {isHydrated && !isOpen && (
        <button
          onClick={toggle}
          className="fixed bottom-4 right-4 z-50 px-4 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
          style={{ backgroundColor: CHATBOT_ORANGE }}
          aria-label="Open chat sidebar with Live Agent ART"
        >
          💬 Live Agent - ART
        </button>
      )}
    </>
  );
}
