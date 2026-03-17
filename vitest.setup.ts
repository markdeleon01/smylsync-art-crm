import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView for tests
Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
    configurable: true
});

