import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SchedulesPage from './page';

// The calendar component is a client component – mock it to avoid
// pulling in browser-only APIs (addEventListener, fetch, etc.) in jsdom
vi.mock('./calendar', () => ({
  SchedulesCalendar: () => <div data-testid="schedules-calendar">Calendar</div>
}));

describe('Schedules Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<SchedulesPage />);
    expect(container).toBeDefined();
  });

  it('displays the Schedules heading', () => {
    const { container } = render(<SchedulesPage />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toContain('Schedules');
  });

  it('displays the page description', () => {
    const { container } = render(<SchedulesPage />);
    expect(container.textContent).toContain(
      'View and manage dental appointments'
    );
  });

  it('prompts the user to use ART for mutations', () => {
    const { container } = render(<SchedulesPage />);
    expect(container.textContent).toContain('ART');
  });

  it('renders the SchedulesCalendar component', () => {
    const { getByTestId } = render(<SchedulesPage />);
    expect(getByTestId('schedules-calendar')).toBeDefined();
  });
});
