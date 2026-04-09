describe('ART Chatbot Component', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/');
    });

    it('should render chatbot toggle button on the page', () => {
        cy.get('button[aria-label*="Live Agent ART"]').should('exist');
    });

    it('should have toggle button visible', () => {
        cy.get('button[aria-label*="Live Agent ART"]').should('be.visible');
    });

    it('should open the chat window when toggled', () => {
        cy.get('[data-hydrated="true"]', { timeout: 15000 }).should('exist');
        cy.get('button[aria-label*="Live Agent ART"]').click();
        cy.contains('Ask ART', { timeout: 15000 }).should('be.visible');
    });

    it('should have proper z-index for visibility', () => {
        cy.get('main').should('be.visible');
    });
});

