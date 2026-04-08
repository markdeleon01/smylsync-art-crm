import { defineConfig } from 'cypress';
import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env so the JWT task uses the real secret when running locally
try {
    const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
    for (const line of envFile.split('\n')) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length && !process.env[key.trim()]) {
            process.env[key.trim()] = rest.join('=').trim();
        }
    }
} catch {
    // .env not present (e.g. CI injects env vars directly)
}

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:8080',
        setupNodeEvents(on, config) {
            on('task', {
                async generateJwtToken() {
                    const secret = new TextEncoder().encode(
                        process.env.JWT_SECRET ?? 'fallback-secret'
                    );
                    const token = await new SignJWT({
                        sub: 'cypress-test-user',
                        email: 'test@smylsync.com',
                        name: 'Cypress Test User',
                        role: 'admin'
                    })
                        .setProtectedHeader({ alg: 'HS256' })
                        .setIssuedAt()
                        .setExpirationTime('1h')
                        .sign(secret);
                    return token;
                }
            });
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
