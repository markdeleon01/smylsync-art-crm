// Cypress support file - loads before each test
// Add custom commands, assertions, and configurations here

import '@testing-library/cypress/add-commands';

// Disable uncaught exception handling for tests that expect errors
Cypress.on('uncaught:exception', (err, runnable) => {
    // Return false to prevent Cypress from failing the test
    // when an uncaught exception occurs
    return false;
});

// Custom command to login (if needed later)
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
});
