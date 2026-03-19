describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('should load the login page', () => {
        cy.contains('Login').should('be.visible');
    });

    it('should display GitHub sign in button', () => {
        cy.contains('Sign in with GitHub').should('be.visible');
    });

    it('should have a login card with proper structure', () => {
        cy.get('[class*="max-w-sm"]').should('be.visible');
        cy.contains('This demo uses GitHub for authentication.').should('be.visible');
    });

    it('should have a form element', () => {
        cy.get('form').should('be.visible');
    });

    it('should have a submit button', () => {
        cy.get('form button').should('contain', 'Sign in');
    });
});
