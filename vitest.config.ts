import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    plugins: [],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html']
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        }
    }
});
