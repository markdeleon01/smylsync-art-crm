describe('Navigation and Links', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should have accessible navigation structure', () => {
        cy.get('nav').should('exist');
        cy.get('button').should('have.length.greaterThan', 0);
    });

    it('should display logo in the sidebar', () => {
        cy.get('img[alt="Logo"]').should('be.visible');
    });

    it('should have proper heading structure on dashboard', () => {
        cy.get('h1').should('contain', 'ART - Admin Rescue Tool');
        cy.get('h2').should('exist');
    });

    it('should have clickable navigation links', () => {
        // Check for navigation items in the sidebar
        cy.get('a').should('have.length.greaterThan', 0);
    });

    it('should render responsive layout', () => {
        // Check that main content is visible
        cy.get('main').should('be.visible');
    });
});
