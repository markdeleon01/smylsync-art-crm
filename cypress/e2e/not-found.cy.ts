describe('Navigation Pages (Expected 404s)', () => {
    it('should show 404 for Schedules page', () => {
        cy.visit('/schedules', { failOnStatusCode: false });
        cy.contains('404').should('exist').or.contains('Not Found').should('exist').or.contains('This page could not be found').should('exist');
    });

    it('should show 404 for Claims page', () => {
        cy.visit('/claims', { failOnStatusCode: false });
        cy.contains('404').should('exist').or.contains('Not Found').should('exist').or.contains('This page could not be found').should('exist');
    });

    it('should show 404 for Credentialing page', () => {
        cy.visit('/credentialing', { failOnStatusCode: false });
        cy.contains('404').should('exist').or.contains('Not Found').should('exist').or.contains('This page could not be found').should('exist');
    });

    it('should show 404 for Analytics page', () => {
        cy.visit('/analytics', { failOnStatusCode: false });
        cy.contains('404').should('exist').or.contains('Not Found').should('exist').or.contains('This page could not be found').should('exist');
    });
});
