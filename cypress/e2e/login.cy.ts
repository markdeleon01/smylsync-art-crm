describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('should load the login page', () => {
        cy.contains('Login').should('be.visible');
    });

    it('should display email and password fields', () => {
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
    });

    it('should have a login card with proper structure', () => {
        cy.get('[class*="max-w-sm"]').should('be.visible');
        cy.contains('Enter your email and password to sign in.').should('be.visible');
    });

    it('should have a form element', () => {
        cy.get('form').should('be.visible');
    });

    it('should have a submit button', () => {
        cy.get('form button').should('contain', 'Sign in');
    });
});
