'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, type Message } from '@/lib/hooks/useChat';
import { X, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

const CHATBOT_ORANGE = '#FFA500';
const CHATBOT_USER_BUBBLE = '#D9F8FF';
const STORAGE_KEY = 'art-chatbot-messages';
const OPEN_STATE_KEY = 'art-chatbot-open';

export default function ArtBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
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
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Handle hydration and load persisted state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load persisted messages
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

      // Load persisted open state
      const savedOpenState = localStorage.getItem(OPEN_STATE_KEY);
      if (savedOpenState) {
        try {
          const isOpenState = JSON.parse(savedOpenState);
          setIsOpen(isOpenState);
        } catch (e) {
          console.error('Failed to load persisted open state:', e);
        }
      }

      setIsHydrated(true);
    }
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Persist open state whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(OPEN_STATE_KEY, JSON.stringify(isOpen));
    }
  }, [isOpen]);

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
      }, 0);
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

  // Reload page after tool execution completes
  useEffect(() => {
    if (!isLoading && toolsExecuted && messages.length > 0) {
      // Ensure messages are saved before reload
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));

      const reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2000);

      return () => clearTimeout(reloadTimer);
    }
  }, [isLoading, toolsExecuted, messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  const handleClose = () => {
    // Clear messages when closing
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OPEN_STATE_KEY);
    }
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3"
      suppressHydrationWarning
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          className="w-96 h-96 bg-white rounded-lg shadow-xl border-4 flex flex-col overflow-hidden"
          style={{ borderColor: CHATBOT_ORANGE }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: CHATBOT_ORANGE }}
          >
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="ART" className="h-5 w-5 shrink-0" />
              <h2 className="font-semibold">Ask ART</h2>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleMinimize}
                    className="p-1 hover:bg-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Minimize chat"
                  >
                    <Minus size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Minimize chat window
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="End chat"
                  >
                    <X size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">End chat window</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-sm text-gray-500">
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
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm rounded-br-none`}
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
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg rounded-bl-none text-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: CHATBOT_ORANGE }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: CHATBOT_ORANGE,
                        animationDelay: '0.1s'
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: CHATBOT_ORANGE,
                        animationDelay: '0.2s'
                      }}
                    ></div>
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
            className="border-t border-gray-200 p-3"
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
                style={{ borderColor: 'inherit' }}
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
      )}

      {/* Toggle Button */}
      <button
        ref={toggleBtnRef}
        onClick={handleToggle}
        className="px-4 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
        style={{ backgroundColor: CHATBOT_ORANGE }}
        aria-expanded={isOpen}
        aria-label={
          isOpen ? 'Close chat window' : 'Open chat window with Live Agent ART'
        }
      >
        💬 Live Agent - ART
      </button>
    </div>
  );
}
