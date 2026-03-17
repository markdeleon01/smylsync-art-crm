import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        viewportWidth: 1280,
        viewportHeight: 720,
        defaultCommandTimeout: 8000,
        requestTimeout: 8000,
        responseTimeout: 8000,
        pageLoadTimeout: 30000
    },
    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack'
        }
    }
});
