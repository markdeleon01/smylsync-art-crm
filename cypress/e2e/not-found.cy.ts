describe('Navigation Pages (Expected 404s)', () => {
    it('should show 404 for Schedules page', () => {
        cy.visit('/schedules', { failOnStatusCode: false });
        cy.get('body').should('contain', /404|Not Found|This page could not be found/);
    });

    it('should show 404 for Claims page', () => {
        cy.visit('/claims', { failOnStatusCode: false });
        cy.get('body').should('contain', /404|Not Found|This page could not be found/);
    });

    it('should show 404 for Credentialing page', () => {
        cy.visit('/credentialing', { failOnStatusCode: false });
        cy.get('body').should('contain', /404|Not Found|This page could not be found/);
    });

    it('should show 404 for Analytics page', () => {
        cy.visit('/analytics', { failOnStatusCode: false });
        cy.get('body').should('contain', /404|Not Found|This page could not be found/);
    });
});
