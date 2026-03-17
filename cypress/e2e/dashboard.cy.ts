describe('Dashboard Page', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should load the dashboard page', () => {
        cy.contains('ART - Admin Rescue Tool').should('be.visible');
    });

    it('should display welcome message', () => {
        cy.contains("Welcome to SMYLSYNC's Admin Rescue Tool!").should('be.visible');
    });

    it('should display navigation menu section', () => {
        cy.contains('Navigation Menu').should('be.visible');
        cy.contains('Use the navigation sidebar on the left to access the following sections:').should('be.visible');
    });

    it('should display all menu item descriptions', () => {
        const menuItems = ['Home', 'Patients', 'Schedules', 'Claims', 'Credentialing', 'Analytics'];

        menuItems.forEach((item) => {
            cy.contains(item).should('be.visible');
        });
    });

    it('should display Home menu item with description', () => {
        cy.contains('Home').should('be.visible');
        cy.contains('Access the main dashboard with an overview of key metrics and information.').should('be.visible');
    });

    it('should display Patients menu item with description', () => {
        cy.contains('Patients').should('be.visible');
        cy.contains('Manage patient records, view patient details, and update patient information.').should('be.visible');
    });

    it('should display Schedules menu item with description', () => {
        cy.contains('Schedules').should('be.visible');
        cy.contains('View and manage appointment schedules, calendar events, and time-based operations.').should('be.visible');
    });

    it('should display Claims menu item with description', () => {
        cy.contains('Claims').should('be.visible');
        cy.contains('Process and track insurance claims, view claim status, and manage documentation.').should('be.visible');
    });

    it('should display Credentialing menu item with description', () => {
        cy.contains('Credentialing').should('be.visible');
        cy.contains('Manage professional credentials, licenses, and certifications for providers.').should('be.visible');
    });

    it('should display Analytics menu item with description', () => {
        cy.contains('Analytics').should('be.visible');
        cy.contains('View detailed analytics, reports, and data visualizations on system performance.').should('be.visible');
    });

    it('should display Internal Operations Assistant section', () => {
        cy.contains('Internal Operations Assistant').should('be.visible');
        cy.contains('Use the ART Live Agent on the bottom right to get help with admin tasks.').should('be.visible');
    });

    it('should have logo in the sidebar', () => {
        cy.get('img[alt="Logo"]').should('be.visible');
    });

    it('should have navigation sidebar with menu items', () => {
        // Check for the nav element
        cy.get('nav').should('have.length.greaterThan', 0);
    });
});
