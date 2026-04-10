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

    it('renders the weekly calendar grid by default', () => {
        cy.contains('Sunday').should('be.visible');
        cy.contains('Saturday').should('be.visible');
    });

    it('shows all seven day column headers in week view', () => {
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach((day) => {
            cy.contains(day).should('exist');
        });
    });

    it('renders the time axis starting at 8:00 AM', () => {
        cy.contains('8:00 AM').should('exist');
    });

    it('renders the time axis ending at 8:00 PM', () => {
        cy.contains('8:00 PM').should('exist');
    });

    it('renders a 12:00 PM midday label in the time axis', () => {
        cy.contains('12:00 PM').should('exist');
    });

    it('has prev/next navigation buttons', () => {
        cy.get('button[aria-label="Previous"]').should('exist');
        cy.get('button[aria-label="Next"]').should('exist');
    });

    it('has a Today button', () => {
        cy.contains('button', 'Today').should('exist');
    });

    it('has a Refresh button', () => {
        cy.get('button[aria-label="Refresh"]').should('exist');
    });

    it('renders the appointment type legend labels', () => {
        ['Checkup', 'Cleaning', 'Extraction', 'Filling', 'Crown', 'Consultation'].forEach((type) => {
            cy.contains(type).should('exist');
        });
    });

    it('shows a stats bar after loading', () => {
        cy.contains(/appointment/).should('exist');
    });

    // -----------------------------------------------------------------------
    // View toggle – Day / Week / Month
    // -----------------------------------------------------------------------

    it('has Day, Week, and Month toggle buttons', () => {
        cy.contains('button', 'Day').should('exist');
        cy.contains('button', 'Week').should('exist');
        cy.contains('button', 'Month').should('exist');
    });

    it('switches to Day view when Day button is clicked', () => {
        cy.contains('button', 'Day').click();
        // Day view shows a single column (day name visible in header)
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        cy.contains(dayName).should('be.visible');
        // Seven-column Sunday header should no longer be a day-column header
        cy.contains('Sunday').should('not.exist');
    });

    it('shows "No appointments scheduled for this day" when day view is empty', () => {
        // Navigate far into the future where there are no appointments
        cy.contains('button', 'Day').click();
        for (let i = 0; i < 60; i++) {
            cy.get('button[aria-label="Next"]').click();
        }
        cy.contains(/No appointments scheduled for this day/i).should('be.visible');
    });

    it('switches to Month view when Month button is clicked', () => {
        cy.contains('button', 'Month').click();
        // Month view header shows short day names (Sun Mon … Sat)
        cy.contains('Sun').should('be.visible');
        cy.contains('Mon').should('be.visible');
        cy.contains('Sat').should('be.visible');
    });

    it('switches back to Week view when Week button is clicked', () => {
        cy.contains('button', 'Month').click();
        cy.contains('button', 'Week').click();
        cy.contains('Sunday').should('be.visible');
        cy.contains('Saturday').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Week navigation
    // -----------------------------------------------------------------------

    it('navigates to the previous week when clicking the back arrow in week view', () => {
        cy.get('button[aria-label="Previous"]').click();
        cy.contains('Sunday').should('be.visible');
    });

    it('navigates to the next week when clicking the forward arrow in week view', () => {
        cy.get('button[aria-label="Next"]').click();
        cy.contains('Sunday').should('be.visible');
    });

    it('shows "this week" stats label in week view', () => {
        cy.contains('this week').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Month navigation
    // -----------------------------------------------------------------------

    it('navigates to the previous month in month view', () => {
        cy.contains('button', 'Month').click();
        // Record current header label
        cy.get('span.font-semibold').invoke('text').then((before) => {
            cy.get('button[aria-label="Previous"]').click();
            cy.get('span.font-semibold').invoke('text').should('not.equal', before);
        });
    });

    it('navigates to the next month in month view', () => {
        cy.contains('button', 'Month').click();
        cy.get('span.font-semibold').invoke('text').then((before) => {
            cy.get('button[aria-label="Next"]').click();
            cy.get('span.font-semibold').invoke('text').should('not.equal', before);
        });
    });

    it('shows "this month" stats label in month view', () => {
        cy.contains('button', 'Month').click();
        cy.contains('this month').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Day navigation
    // -----------------------------------------------------------------------

    it('navigates to the previous day when clicking back in day view', () => {
        cy.contains('button', 'Day').click();
        cy.get('span.font-semibold').invoke('text').then((before) => {
            cy.get('button[aria-label="Previous"]').click();
            cy.get('span.font-semibold').invoke('text').should('not.equal', before);
        });
    });

    it('navigates to the next day when clicking forward in day view', () => {
        cy.contains('button', 'Day').click();
        cy.get('span.font-semibold').invoke('text').then((before) => {
            cy.get('button[aria-label="Next"]').click();
            cy.get('span.font-semibold').invoke('text').should('not.equal', before);
        });
    });

    it('shows "today" stats label in day view', () => {
        cy.contains('button', 'Day').click();
        cy.contains('today').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Today button
    // -----------------------------------------------------------------------

    it('clicking Today switches to Day view showing today', () => {
        // Navigate away first
        cy.contains('button', 'Month').click();
        cy.get('button[aria-label="Next"]').click();
        cy.contains('button', 'Today').click();
        // After Today we should be in Day view
        cy.contains('today').should('be.visible');
    });

    it('Today button navigates back from a future week to current day view', () => {
        cy.get('button[aria-label="Next"]').click();
        cy.get('button[aria-label="Next"]').click();
        cy.contains('button', 'Today').click();
        cy.contains('today').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Appointment type filter
    // -----------------------------------------------------------------------

    it('legend buttons are clickable', () => {
        cy.contains('Checkup').click();
        // After clicking, all other labels should dim (opacity-30)
        cy.contains('Cleaning').should('have.css', 'opacity', '0.3');
    });

    it('clicking an active filter label again deactivates it', () => {
        cy.contains('Checkup').click();
        cy.contains('Checkup').click();
        // After double-click Cleaning should be back to full opacity
        cy.contains('Cleaning').should('not.have.css', 'opacity', '0.3');
    });

    it('multiple type filters can be active simultaneously', () => {
        cy.contains('Checkup').click();
        cy.contains('Cleaning').click();
        // Both should show the ring class (active), not be dimmed
        cy.contains('Extraction').should('have.css', 'opacity', '0.3');
        cy.contains('Checkup').should('not.have.css', 'opacity', '0.3');
        cy.contains('Cleaning').should('not.have.css', 'opacity', '0.3');
    });

    it('filter state persists across view changes', () => {
        cy.contains('Checkup').click();
        cy.contains('button', 'Month').click();
        // Cleaning should still be dimmed in month view
        cy.contains('Cleaning').should('have.css', 'opacity', '0.3');
        cy.contains('button', 'Day').click();
        cy.contains('Cleaning').should('have.css', 'opacity', '0.3');
    });

    // -----------------------------------------------------------------------
    // Refresh
    // -----------------------------------------------------------------------

    it('re-renders calendar after Refresh is clicked in week view', () => {
        cy.get('button[aria-label="Refresh"]').click();
        cy.contains('Sunday').should('be.visible');
    });

    it('re-renders calendar after Refresh is clicked in month view', () => {
        cy.contains('button', 'Month').click();
        cy.get('button[aria-label="Refresh"]').click();
        cy.contains('Sun').should('be.visible');
    });

    it('re-renders calendar after Refresh is clicked in day view', () => {
        cy.contains('button', 'Day').click();
        cy.get('button[aria-label="Refresh"]').click();
        cy.contains('today').should('be.visible');
    });

    // -----------------------------------------------------------------------
    // Appointment detail bubble (conditional on data)
    // -----------------------------------------------------------------------

    it('shows appointment detail bubble when an appointment block is clicked', () => {
        cy.get('body').then(($body) => {
            const apptButtons = $body.find('[style*="position: absolute"]').filter('button');
            if (apptButtons.length > 0) {
                cy.wrap(apptButtons.first()).click();
                cy.contains('Status').should('be.visible');
                cy.contains(/Ask ART/i).should('be.visible');
            }
        });
    });

    it('closes the bubble when the close button is clicked', () => {
        cy.get('body').then(($body) => {
            const apptButtons = $body.find('[style*="position: absolute"]').filter('button');
            if (apptButtons.length > 0) {
                cy.wrap(apptButtons.first()).click();
                cy.contains('Status').should('be.visible');
                cy.get('button[aria-label="Close"]').first().click();
                cy.contains('Status').should('not.exist');
            }
        });
    });

    it('closes the bubble when Escape is pressed', () => {
        cy.get('body').then(($body) => {
            const apptButtons = $body.find('[style*="position: absolute"]').filter('button');
            if (apptButtons.length > 0) {
                cy.wrap(apptButtons.first()).click();
                cy.contains('Status').should('be.visible');
                cy.get('body').type('{esc}');
                cy.contains('Status').should('not.exist');
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
                expect(res.status).to.be.oneOf([200, 201]);
                expect(res.body).to.have.property('id');
                expect(res.body.patient_id).to.eq(patient.id);
                expect(res.body.status).to.eq('scheduled');

                // Clean up
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
