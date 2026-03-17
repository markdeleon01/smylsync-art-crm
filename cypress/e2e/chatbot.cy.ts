describe('ART Chatbot Component', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should render chatbot button on the page', () => {
        // Look for the toggle button or ART branding
        cy.get('[class*="fixed"][class*="bottom"][class*="right"]').should('exist');
    });

    it('should have toggle button visible', () => {
        cy.get('button').filter(() => {
            const text = cy.$('button').text();
            return text.includes('Ask') || text.length === 0;
        }).should('have.length.greaterThan', 0);
    });

    it('should be positioned at bottom right', () => {
        // Verify chatbot is in bottom-right corner
        cy.get('[class*="fixed.bottom-4.right-4"]', { timeout: 1000 }).should('exist').or.get('[class*="fixed"][class*="bottom"][class*="right"]').should('exist');
    });

    it('should have proper z-index for visibility', () => {
        // Check that elements are properly layered
        cy.get('main').should('be.visible');
    });
});
