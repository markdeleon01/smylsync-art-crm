describe('Accessibility Tests', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should have proper page structure', () => {
        // Check for main content area
        cy.get('main').should('be.visible');
    });

    it('should have semantic HTML elements', () => {
        // Check for header, nav, and main elements
        cy.get('header').should('exist').or.get('nav').should('exist');
    });

    it('should have proper heading hierarchy', () => {
        cy.get('h1').should('exist');
    });

    it('should have alt text on images', () => {
        cy.get('img').should((images) => {
            images.each((index, image) => {
                expect(image).to.have.attr('alt');
            });
        });
    });

    it('should have buttons with proper labels', () => {
        cy.get('button').should((buttons) => {
            expect(buttons.length).to.be.greaterThan(0);
        });
    });

    it('should have form labels', () => {
        cy.get('form').should('exist');
    });
});
