import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import LoginPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })
}));

describe('Login Page', () => {
  it('should render the login page', () => {
    const { container } = render(<LoginPage />);

    expect(container).toBeDefined();
  });

  it('should display login card', () => {
    const { container } = render(<LoginPage />);

    expect(container.querySelector('.max-w-sm')).toBeDefined();
  });

  it('should have correct title', () => {
    const { container } = render(<LoginPage />);

    expect(container.textContent).toContain('Login');
  });

  it('should display authentication description', () => {
    const { container } = render(<LoginPage />);

    expect(container.textContent).toContain(
      'Enter your email and password to sign in.'
    );
  });

  it('should have sign in button', () => {
    const { container } = render(<LoginPage />);

    expect(container.textContent).toContain('Sign in');
  });

  it('should render form element', () => {
    const { container } = render(<LoginPage />);

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });
});
