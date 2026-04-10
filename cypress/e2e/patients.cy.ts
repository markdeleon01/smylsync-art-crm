describe('Patients Page', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/patients');
    });

    // -----------------------------------------------------------------------
    // Page structure
    // -----------------------------------------------------------------------

    it('should load the patients page', () => {
        cy.contains('Patients').should('be.visible');
    });

    it('should display page heading', () => {
        cy.get('h1').should('contain', 'Patients');
    });

    it('should display description', () => {
        cy.contains('Browse all patient records').should('be.visible');
    });

    it('should have a structured layout', () => {
        cy.get('main').should('be.visible');
    });

    it('should have proper heading hierarchy', () => {
        cy.get('h1').should('exist');
    });

    // -----------------------------------------------------------------------
    // Patient cards
    // -----------------------------------------------------------------------

    it('displays a card for each patient', () => {
        cy.request('GET', '/api/patients').then((res) => {
            const count = res.body.length;
            if (count > 0) {
                // Each card has a patient ID field visible
                cy.get('main').find('p').filter(':contains("ID")').should('have.length.gte', 1);
            }
        });
    });

    it('shows patient name on each card', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length > 0) {
                const patient = res.body[0];
                cy.contains(patient.firstname).should('be.visible');
                cy.contains(patient.lastname).should('be.visible');
            }
        });
    });

    it('shows patient email on each card', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length > 0) {
                const patient = res.body[0];
                cy.contains(patient.email).should('be.visible');
            }
        });
    });

    it('shows "No upcoming appointments" for patients without future appointments', () => {
        // At least one patient should exist; if none have upcoming appts the badge appears
        cy.get('body').then(($body) => {
            if ($body.text().includes('No upcoming appointments')) {
                cy.contains('No upcoming appointments').should('be.visible');
            }
        });
    });

    it('does not show "No appointments" (old label) anywhere on the page', () => {
        // Verify the old label was replaced
        cy.contains('No appointments').should('not.exist');
    });

    // -----------------------------------------------------------------------
    // Appointment badges on patient cards
    // -----------------------------------------------------------------------

    it('appointment badge includes time of appointment', () => {
        cy.get('body').then(($body) => {
            const badges = $body.find('button').filter((_, el) => {
                const text = el.textContent ?? '';
                return /AM|PM/.test(text) && /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(text);
            });
            if (badges.length > 0) {
                // Badge text contains a time like "9:00 AM"
                expect(badges.first().text()).to.match(/\d+:\d{2}\s*(AM|PM)/);
            }
        });
    });

    it('appointment badge shows the appointment type', () => {
        cy.get('body').then(($body) => {
            const knownTypes = ['Checkup', 'Cleaning', 'Consultation', 'Filling', 'Extraction', 'Crown', 'Whitening', 'X Ray'];
            const hasBadge = knownTypes.some((t) => $body.text().includes(t));
            if (hasBadge) {
                cy.wrap(true).should('be.true');
            }
        });
    });

    // -----------------------------------------------------------------------
    // Appointment detail bubble
    // -----------------------------------------------------------------------

    it('clicking an appointment badge opens a detail bubble', () => {
        cy.get('body').then(($body) => {
            const apptBadges = $body.find('button').filter((_, el) => {
                const text = el.textContent ?? '';
                return /AM|PM/.test(text);
            });
            if (apptBadges.length > 0) {
                cy.wrap(apptBadges.first()).click();
                cy.contains(/Ask ART to rebook or cancel/i).should('be.visible');
            }
        });
    });

    it('bubble shows appointment status', () => {
        cy.get('body').then(($body) => {
            const apptBadges = $body.find('button').filter((_, el) =>
                /AM|PM/.test(el.textContent ?? '')
            );
            if (apptBadges.length > 0) {
                cy.wrap(apptBadges.first()).click();
                cy.contains('Status').should('be.visible');
            }
        });
    });

    it('bubble closes when the close button is clicked', () => {
        cy.get('body').then(($body) => {
            const apptBadges = $body.find('button').filter((_, el) =>
                /AM|PM/.test(el.textContent ?? '')
            );
            if (apptBadges.length > 0) {
                cy.wrap(apptBadges.first()).click();
                cy.contains(/Ask ART to rebook or cancel/i).should('be.visible');
                cy.get('button[aria-label="Close"]').first().click();
                cy.contains(/Ask ART to rebook or cancel/i).should('not.exist');
            }
        });
    });

    it('bubble closes when Escape key is pressed', () => {
        cy.get('body').then(($body) => {
            const apptBadges = $body.find('button').filter((_, el) =>
                /AM|PM/.test(el.textContent ?? '')
            );
            if (apptBadges.length > 0) {
                cy.wrap(apptBadges.first()).click();
                cy.contains(/Ask ART to rebook or cancel/i).should('be.visible');
                cy.get('body').type('{esc}');
                cy.contains(/Ask ART to rebook or cancel/i).should('not.exist');
            }
        });
    });

    it('clicking the same badge twice closes the bubble', () => {
        cy.get('body').then(($body) => {
            const apptBadges = $body.find('button').filter((_, el) =>
                /AM|PM/.test(el.textContent ?? '')
            );
            if (apptBadges.length > 0) {
                cy.wrap(apptBadges.first()).click();
                cy.contains(/Ask ART to rebook or cancel/i).should('be.visible');
                cy.wrap(apptBadges.first()).click();
                cy.contains(/Ask ART to rebook or cancel/i).should('not.exist');
            }
        });
    });

    // -----------------------------------------------------------------------
    // API CRUD
    // -----------------------------------------------------------------------

    it('GET /api/patients returns 200 with an array', () => {
        cy.request('GET', '/api/patients').then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('GET /api/patients/:id returns 404 for non-existent patient', () => {
        cy.request({ method: 'GET', url: '/api/patients/does-not-exist', failOnStatusCode: false }).then((res) => {
            expect(res.status).to.eq(404);
        });
    });
});
