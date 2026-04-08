// Cypress support file - loads before each test
// Add custom commands, assertions, and configurations here

import '@testing-library/cypress/add-commands';

// Disable uncaught exception handling for tests that expect errors
Cypress.on('uncaught:exception', (err, runnable) => {
    // Return false to prevent Cypress from failing the test
    // when an uncaught exception occurs
    return false;
});

// Sets a signed JWT cookie so protected routes load without going through the login UI.
// Uses the same secret as proxy.ts (JWT_SECRET env var, fallback: 'fallback-secret').
Cypress.Commands.add('login', () => {
    cy.task('generateJwtToken').then((token) => {
        cy.setCookie('token', token as string);
    });
});
