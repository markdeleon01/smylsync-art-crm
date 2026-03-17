import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from './page';

describe('Dashboard Page', () => {
  it('should render the page title', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    expect(container).toBeDefined();
  });

  it('should contain ART heading', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    const heading = container.querySelector('h1');
    expect(heading?.textContent).toContain('ART - Admin Rescue Tool');
  });

  it('should display welcome message', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain(
      "Welcome to SMYLSYNC's Admin Rescue Tool!"
    );
  });

  it('should display navigation menu section', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Navigation Menu');
  });

  it('should display all menu items', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    const menuItems = [
      'Home',
      'Patients',
      'Schedules',
      'Claims',
      'Credentialing',
      'Analytics'
    ];
    menuItems.forEach((item) => {
      expect(container.textContent).toContain(item);
    });
  });

  it('should display ART Live Agent message', async () => {
    const result = await DashboardPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain(
      'Use the ART Live Agent on the bottom right to get help with admin tasks.'
    );
  });
});
