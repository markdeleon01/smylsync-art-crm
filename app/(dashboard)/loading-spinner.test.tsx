import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoadingSpinner } from './loading-spinner';

// ── Mock next/navigation ───────────────────────────────────────────────────

const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
    usePathname: () => mockPathname(),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LoadingSpinner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPathname.mockReturnValue('/');
    });

    it('renders nothing when not loading', () => {
        const { container } = render(<LoadingSpinner />);
        expect(container.firstChild).toBeNull();
    });

    it('shows the spinner overlay when an internal link is clicked', () => {
        render(
            <>
                <LoadingSpinner />
                <a href="/patients">Go to Patients</a>
            </>
        );
        fireEvent.click(screen.getByText('Go to Patients'));
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not show the spinner when an external link is clicked', () => {
        render(
            <>
                <LoadingSpinner />
                <a href="https://example.com">External</a>
            </>
        );
        fireEvent.click(screen.getByText('External'));
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('does not show the spinner when an anchor link (#) is clicked', () => {
        render(
            <>
                <LoadingSpinner />
                <a href="#section">Jump</a>
            </>
        );
        fireEvent.click(screen.getByText('Jump'));
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('hides the spinner when the pathname changes (navigation complete)', () => {
        const { rerender } = render(
            <>
                <LoadingSpinner />
                <a href="/patients">Go to Patients</a>
            </>
        );

        // Trigger loading
        fireEvent.click(screen.getByText('Go to Patients'));
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Simulate navigation completing (pathname changes)
        mockPathname.mockReturnValue('/patients');
        act(() => {
            rerender(
                <>
                    <LoadingSpinner />
                    <a href="/patients">Go to Patients</a>
                </>
            );
        });
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('renders the spinner with fixed-position overlay classes', () => {
        render(
            <>
                <LoadingSpinner />
                <a href="/patients">Go</a>
            </>
        );
        fireEvent.click(screen.getByText('Go'));

        const overlay = document.querySelector('.fixed.inset-0');
        expect(overlay).not.toBeNull();
    });

    it('renders the animated spin element inside the overlay', () => {
        render(
            <>
                <LoadingSpinner />
                <a href="/patients">Go</a>
            </>
        );
        fireEvent.click(screen.getByText('Go'));

        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
    });
});
