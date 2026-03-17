describe('Patients Page', () => {
    beforeEach(() => {
        cy.visit('/patients');
    });

    it('should load the patients page', () => {
        cy.contains('Patients').should('be.visible');
    });

    it('should display page heading', () => {
        cy.get('h1').should('contain', 'Patients');
    });

    it('should display description', () => {
        cy.contains('View all patients.').should('be.visible');
    });

    it('should have a structured layout', () => {
        cy.get('main').should('be.visible');
    });

    it('should have proper heading hierarchy', () => {
        cy.get('h1').should('exist');
    });
});
