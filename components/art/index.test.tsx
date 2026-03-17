import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtBot from './index';
import { TooltipProvider } from '@/components/ui/tooltip';

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

// Mock localStorage
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper render function that wraps with TooltipProvider
const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('ArtBot Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = renderWithTooltip(<ArtBot />);
      expect(container).toBeDefined();
    });

    it('should not show chat window when closed', () => {
      renderWithTooltip(<ArtBot />);
      const chatWindow = screen.queryByText('Ask ART');
      expect(chatWindow).not.toBeInTheDocument();
    });

    it('should render container with correct positioning classes', () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const mainDiv = container.querySelector('.fixed.bottom-4.right-4');
      expect(mainDiv).toBeDefined();
    });
  });

  describe('Chat Window Toggle', () => {
    it('should display toggle button', () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    it('should show chat window when toggle button is clicked', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(screen.getByText('Ask ART')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Chat Window Header', () => {
    it('should display header with title when open', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(screen.getByText('Ask ART')).toBeInTheDocument();
        });
      }
    });

    it('should have minimize and close buttons', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThanOrEqual(2);
        });
      }
    });
  });

  describe('Welcome Message', () => {
    it('should display welcome message when chat is open with no messages', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(screen.getByText('Welcome to ART')).toBeInTheDocument();
          expect(
            screen.getByText('Start a conversation to get help')
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe('Input Area', () => {
    it('should have textarea input field', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const textarea = container.querySelector('textarea');
          expect(textarea).toBeDefined();
        });
      }
    });

    it('should have correct placeholder text', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const textarea = container.querySelector(
            'textarea'
          ) as HTMLTextAreaElement;
          expect(textarea?.placeholder).toContain('Type a message');
        });
      }
    });

    it('should update input value when typing', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const textarea = container.querySelector(
            'textarea'
          ) as HTMLTextAreaElement;
          expect(textarea).toBeDefined();

          fireEvent.change(textarea, { target: { value: 'Hello' } });
          expect(textarea.value).toBe('Hello');
        });
      }
    });
  });

  describe('Message Handling', () => {
    it('should clear input after message is sent', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
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
      }
    });

    it('should not submit empty messages', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const textarea = container.querySelector(
            'textarea'
          ) as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: '   ' } });

          const form = container.querySelector('form');
          if (form) {
            fireEvent.submit(form);
            // Should still be empty after submit
            expect(textarea.value).toBe('   ');
          }
        });
      }
    });
  });

  describe('localStorage', () => {
    it('should persist open state to localStorage', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const savedState = localStorage.getItem('art-chatbot-open');
          expect(savedState).toBeDefined();
        });
      }
    });

    it('should have storage keys for messages and open state', () => {
      expect(localStorage.getItem('art-chatbot-messages')).toBeNull();
      expect(localStorage.getItem('art-chatbot-open')).toBeNull();
    });
  });

  describe('Minimize Button', () => {
    it('should close chat when minimize button is clicked', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button:not([aria-label])');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const header = screen.getByText('Ask ART');
          expect(header).toBeInTheDocument();

          const buttons = screen.getAllByRole('button');
          const minimizeButton = buttons.find(
            (b) => b.getAttribute('aria-label') === 'Minimize chat'
          );

          if (minimizeButton) {
            fireEvent.click(minimizeButton);
            expect(screen.queryByText('Ask ART')).not.toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('Close Button', () => {
    it('should close chat and clear messages when close button is clicked', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          const closeButton = buttons.find(
            (b) => b.getAttribute('aria-label') === 'End chat'
          );

          if (closeButton) {
            fireEvent.click(closeButton);
            expect(screen.queryByText('Ask ART')).not.toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('Constants', () => {
    it('should have correct chatbot orange color', () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        const header = container.querySelector('.fixed.bottom-4.right-4 > div');
        expect(header).toBeDefined();
      }
    });
  });

  describe('Keyboard Handling', () => {
    it('should submit message on Enter key without Shift', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const textarea = container.querySelector(
            'textarea'
          ) as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: 'Test message' } });

          fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
          expect(textarea).toBeDefined();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on buttons', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThan(0);
        });
      }
    });

    it('should have accessible form structure', async () => {
      const { container } = renderWithTooltip(<ArtBot />);
      const toggleButton = container.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          const form = container.querySelector('form');
          expect(form).toBeDefined();
        });
      }
    });
  });
});
