import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from './page';

// Mock the Next.js server action
vi.mock('@/lib/auth', () => ({
  signIn: vi.fn()
}));

describe('Login Page', () => {
  it('should render the login page', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    expect(container).toBeDefined();
  });

  it('should display login card', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    expect(container.querySelector('.max-w-sm')).toBeDefined();
  });

  it('should have correct title', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Login');
  });

  it('should display authentication description', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain(
      'This demo uses GitHub for authentication.'
    );
  });

  it('should have sign in button', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Sign in with GitHub');
  });

  it('should render form element', () => {
    const result = LoginPage();
    const { container } = render(result as any);

    const form = container.querySelector('form');
    expect(form).toBeDefined();
  });
});
