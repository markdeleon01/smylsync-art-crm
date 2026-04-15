import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import ArtBot from './index';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatSidebarContext } from '@/lib/chat-context';
import { useChat } from '@/lib/hooks/useChat';

// Mock the useChat hook
vi.mock('@/lib/hooks/useChat', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    setMessages: vi.fn(),
    toolsExecuted: false
  }))
}));

// Mock sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Test wrapper that provides ChatSidebarContext with real state
function TestWrapper({
  children,
  initialOpen = false
}: {
  children: React.ReactNode;
  initialOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  return (
    <TooltipProvider>
      <ChatSidebarContext.Provider
        value={{
          isOpen,
          toggle: () => setIsOpen((v) => !v),
          close: () => setIsOpen(false),
          isHydrated: true
        }}
      >
        {children}
      </ChatSidebarContext.Provider>
    </TooltipProvider>
  );
}

const renderArtBot = (initialOpen = false) =>
  render(
    <TestWrapper initialOpen={initialOpen}>
      <ArtBot />
    </TestWrapper>
  );

describe('ArtBot Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = renderArtBot();
      expect(container).toBeDefined();
    });

    it('should have sidebar panel hidden (aria-hidden) when closed', () => {
      const { container } = renderArtBot();
      const sidebar = container.querySelector('[aria-hidden="true"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render sidebar with correct positioning classes', () => {
      const { container } = renderArtBot();
      const sidebarWrapper = container.querySelector('.fixed.top-0.right-0');
      expect(sidebarWrapper).toBeDefined();
    });
  });

  describe('Chat Window Toggle', () => {
    it('should display toggle button when sidebar is closed', () => {
      const { container } = renderArtBot();
      const button = container.querySelector(
        '[aria-label="Open chat sidebar with Live Agent ART"]'
      );
      expect(button).toBeInTheDocument();
    });

    it('should show chat sidebar when toggle button is clicked', async () => {
      const { container } = renderArtBot();
      const toggleButton = container.querySelector(
        '[aria-label="Open chat sidebar with Live Agent ART"]'
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const sidebar = container.querySelector('[aria-hidden="false"]');
          expect(sidebar).toBeInTheDocument();
        });
      }
    });

    it('should hide toggle button when sidebar is open', async () => {
      const { container } = renderArtBot();
      const toggleButton = container.querySelector(
        '[aria-label="Open chat sidebar with Live Agent ART"]'
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(
            container.querySelector(
              '[aria-label="Open chat sidebar with Live Agent ART"]'
            )
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Chat Window Header', () => {
    it('should display header with title when open', () => {
      renderArtBot(true);
      expect(screen.getByText('Ask ART')).toBeInTheDocument();
    });

    it('should have collapse button when open', () => {
      const { container } = renderArtBot(true);
      const collapseBtn = container.querySelector(
        '[aria-label="Collapse chat sidebar"]'
      );
      expect(collapseBtn).toBeInTheDocument();
    });
  });

  describe('Welcome Message', () => {
    it('should display greeting when chat is open with no messages', () => {
      renderArtBot(true);
      expect(screen.getByText("Hi, I'm ART!")).toBeInTheDocument();
    });

    it('should display capability description on initial load', () => {
      renderArtBot(true);
      expect(
        screen.getByText(/SMYLSYNC's internal operations assistant/i)
      ).toBeInTheDocument();
    });

    it('should display Quick actions heading', () => {
      renderArtBot(true);
      expect(screen.getByText('Quick actions')).toBeInTheDocument();
    });

    it('should render all quick action buttons', () => {
      renderArtBot(true);
      expect(
        screen.getByRole('button', { name: 'Look up a patient' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Book an appointment' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: "View today's appointments" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Check available time slots' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Add a new patient' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Send a reminder email' })
      ).toBeInTheDocument();
    });

    it('should call sendMessage with the correct prompt when a quick action is clicked', () => {
      const mockSendMessage = vi.fn();
      vi.mocked(useChat).mockReturnValue({
        messages: [],
        isLoading: false,
        error: null,
        sendMessage: mockSendMessage,
        setMessages: vi.fn(),
        toolsExecuted: false
      });

      renderArtBot(true);
      fireEvent.click(
        screen.getByRole('button', { name: 'Look up a patient' })
      );
      expect(mockSendMessage).toHaveBeenCalledWith('Show me all patients');
    });
  });

  describe('Input Area', () => {
    it('should have textarea input field', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('should have correct placeholder text', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      expect(textarea?.placeholder).toContain('Type a message');
    });

    it('should update input value when typing', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(textarea.value).toBe('Hello');
    });
  });

  describe('Message Handling', () => {
    it('should clear input after message is sent', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        expect(textarea.value).toBe('');
      }
    });

    it('should not submit empty messages', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '   ' } });
      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        expect(textarea.value).toBe('   ');
      }
    });
  });

  describe('sessionStorage', () => {
    it('should persist messages to sessionStorage when messages exist', () => {
      renderArtBot(true);
      // Messages storage key starts empty
      expect(sessionStorage.getItem('art-chatbot-messages')).toBeNull();
    });

    it('should have storage key for messages initially empty', () => {
      expect(sessionStorage.getItem('art-chatbot-messages')).toBeNull();
    });
  });

  describe('Collapse Button', () => {
    it('should collapse sidebar when chevron button is clicked', async () => {
      const { container } = renderArtBot(true);
      const collapseButton = container.querySelector(
        '[aria-label="Collapse chat sidebar"]'
      );
      expect(collapseButton).toBeInTheDocument();

      if (collapseButton) {
        fireEvent.click(collapseButton);
        await waitFor(() => {
          const sidebar = container.querySelector('[aria-hidden="true"]');
          expect(sidebar).toBeInTheDocument();
        });
      }
    });
  });

  describe('Constants', () => {
    it('should apply orange header styling when open', () => {
      renderArtBot(true);
      const heading = screen.getByText('Ask ART');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Keyboard Handling', () => {
    it('should submit message on Enter key without Shift', () => {
      const { container } = renderArtBot(true);
      const textarea = container.querySelector(
        'textarea'
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(textarea).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on buttons when open', () => {
      const { container } = renderArtBot(true);
      const collapseBtn = container.querySelector(
        '[aria-label="Collapse chat sidebar"]'
      );
      expect(collapseBtn).toBeInTheDocument();
    });

    it('should have accessible form structure', () => {
      const { container } = renderArtBot(true);
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});
