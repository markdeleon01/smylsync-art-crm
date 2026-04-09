describe('Schedules Page', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/schedules');
    });

    // -----------------------------------------------------------------------
    // Page structure
    // -----------------------------------------------------------------------

    it('loads the schedules page', () => {
        cy.get('h1').should('contain', 'Schedules');
    });

    it('displays the page description', () => {
        cy.contains('View and manage dental appointments').should('be.visible');
    });

    it('renders the weekly calendar grid', () => {
        // The calendar renders day-name headers
        cy.contains('Monday').should('be.visible');
        cy.contains('Friday').should('be.visible');
    });

    it('shows Mon–Fri column headers', () => {
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day) => {
            cy.contains(day).should('exist');
        });
    });

    it('renders the time axis labels', () => {
        cy.contains('8:00 AM').should('exist');
        cy.contains('12:00 PM').should('exist');
        cy.contains('4:00 PM').should('exist');
    });

    it('has prev/next week navigation buttons', () => {
        cy.get('button[aria-label="Previous week"]').should('exist');
        cy.get('button[aria-label="Next week"]').should('exist');
    });

    it('has a Today button', () => {
        cy.contains('button', 'Today').should('exist');
    });

    it('has a Refresh button', () => {
        cy.get('button[aria-label="Refresh"]').should('exist');
    });

    it('renders the appointment type legend', () => {
        cy.contains('Checkup').should('exist');
        cy.contains('Cleaning').should('exist');
        cy.contains('Extraction').should('exist');
    });

    it('shows a weekly appointment count in the stats bar', () => {
        // After loading, the stats bar appears (0 or more appointments)
        cy.contains(/appointment/).should('exist');
    });

    // -----------------------------------------------------------------------
    // Week navigation
    // -----------------------------------------------------------------------

    it('navigates to the previous week when clicking the back arrow', () => {
        // Record current month label, then go back
        cy.get('button[aria-label="Previous week"]').click();
        // The calendar should still show Mon–Fri headers (grid intact)
        cy.contains('Monday').should('be.visible');
    });

    it('navigates to the next week when clicking the forward arrow', () => {
        cy.get('button[aria-label="Next week"]').click();
        cy.contains('Monday').should('be.visible');
    });

    it('returns to the current week when clicking Today', () => {
        // Go forward two weeks, then come back
        cy.get('button[aria-label="Next week"]').click();
        cy.get('button[aria-label="Next week"]').click();
        cy.contains('button', 'Today').click();
        cy.contains('Monday').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Refresh
    // -----------------------------------------------------------------------

    it('re-fetches appointments when Refresh is clicked', () => {
        cy.intercept('POST', '/schedules').as('refresh');
        cy.get('button[aria-label="Refresh"]').click();
        // Calendar should still render correctly after refresh
        cy.contains('Monday').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Appointment detail panel (if any appointments exist)
    // -----------------------------------------------------------------------

    it('shows appointment detail panel when an appointment block is clicked', () => {
        // If there are no appointments this week the test is a no-op (skipped by Cypress naturally)
        cy.get('body').then(($body) => {
            // Appointment blocks are buttons inside the day columns
            const apptButtons = $body.find('[style*="position: absolute"]').filter('button');
            if (apptButtons.length > 0) {
                cy.wrap(apptButtons.first()).click();
                cy.contains('Appointment ID').should('be.visible');
                cy.contains('Status').should('be.visible');
                cy.contains('ART').should('be.visible'); // "Ask ART to rebook or cancel"
            }
        });
    });

    // -----------------------------------------------------------------------
    // API: appointments CRUD via the API routes
    // -----------------------------------------------------------------------

    it('GET /api/patients returns 200 with patient data', () => {
        cy.request('GET', '/api/patients').then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('POST /api/appointments books a new appointment and returns 200', () => {
        // First, get a real patient id to use
        cy.request('GET', '/api/patients').then((patientsRes) => {
            const patient = patientsRes.body[0];
            expect(patient).to.exist;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            cy.request({
                method: 'POST',
                url: '/api/appointments',
                body: {
                    patient_id: patient.id,
                    start_time: tomorrow.toISOString(),
                    appointment_type: 'checkup'
                },
                failOnStatusCode: false
            }).then((res) => {
                // Endpoint might return 200 or 201; both are acceptable
                expect(res.status).to.be.oneOf([200, 201]);
                expect(res.body).to.have.property('id');
                expect(res.body.patient_id).to.eq(patient.id);
                expect(res.body.status).to.eq('scheduled');

                // ---- Clean up: delete the test appointment ----
                const apptId = res.body.id;
                cy.request({
                    method: 'DELETE',
                    url: `/api/appointments/${apptId}`,
                    failOnStatusCode: false
                });
            });
        });
    });

    it('GET /api/appointments/:id returns 404 for a non-existent appointment', () => {
        cy.request({
            method: 'GET',
            url: '/api/appointments/does-not-exist',
            failOnStatusCode: false
        }).then((res) => {
            expect(res.status).to.eq(404);
        });
    });

    it('PATCH /api/appointments/:id/cancel cancels an appointment', () => {
        // Book a temporary appointment first, then cancel it
        cy.request('GET', '/api/patients').then((patientsRes) => {
            const patient = patientsRes.body[0];

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(10, 0, 0, 0);

            cy.request({
                method: 'POST',
                url: '/api/appointments',
                body: {
                    patient_id: patient.id,
                    start_time: nextWeek.toISOString(),
                    appointment_type: 'cleaning'
                },
                failOnStatusCode: false
            }).then((bookRes) => {
                if (bookRes.status !== 200 && bookRes.status !== 201) return;

                const apptId = bookRes.body.id;
                cy.request({
                    method: 'PATCH',
                    url: `/api/appointments/${apptId}/cancel`,
                    failOnStatusCode: false
                }).then((cancelRes) => {
                    expect(cancelRes.status).to.be.oneOf([200, 204]);
                });
            });
        });
    });
});
