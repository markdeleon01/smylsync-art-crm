describe('Navigation and Links', () => {
    beforeEach(() => {
        cy.login();
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

    it('clicking Patients link navigates to the patients page', () => {
        cy.get('a[href="/patients"]').first().click();
        cy.url().should('include', '/patients');
        cy.get('h1').should('contain', 'Patients');
    });

    it('clicking Schedules link navigates to the schedules page', () => {
        cy.get('a[href="/schedules"]').first().click();
        cy.url().should('include', '/schedules');
        cy.get('h1').should('contain', 'Schedules');
    });

    it('clicking Home link navigates back to the dashboard', () => {
        cy.visit('/patients');
        cy.get('a[href="/"]').first().click();
        cy.url().should('match', /\/$/);
        cy.get('h1').should('contain', 'ART');
    });
});
