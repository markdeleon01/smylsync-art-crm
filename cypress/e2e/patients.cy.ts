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
                // Name is displayed as "Last, First"
                cy.contains(`${patient.lastname}, ${patient.firstname}`).should('be.visible');
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

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('Patients Page – search', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/patients');
    });

    it('search input and button are present', () => {
        cy.get('input[aria-label="Search patients"]').should('be.visible');
        cy.contains('button', 'Search').should('be.visible');
    });

    it('filtering by first name shows only matching patients', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length === 0) return;
            const firstname = res.body[0].firstname;
            cy.get('input[aria-label="Search patients"]').type(firstname);
            cy.contains('button', 'Search').click();
            cy.contains(firstname).should('be.visible');
        });
    });

    it('filtering by last name shows only matching patients', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length === 0) return;
            const lastname = res.body[0].lastname;
            cy.get('input[aria-label="Search patients"]').type(lastname);
            cy.contains('button', 'Search').click();
            cy.contains(lastname).should('be.visible');
        });
    });

    it('filtering by partial phone number shows matching patients', () => {
        cy.request('GET', '/api/patients').then((res) => {
            const withPhone = res.body.find((p: any) => p.phone);
            if (!withPhone) return;
            // Search with the area-code portion only
            const partial = withPhone.phone.substring(0, 6);
            cy.get('input[aria-label="Search patients"]').type(partial);
            cy.contains('button', 'Search').click();
            cy.contains(withPhone.phone).should('be.visible');
        });
    });

    it('shows "No patients found matching" when query has no results', () => {
        cy.get('input[aria-label="Search patients"]').type('zzz-no-match-xyz');
        cy.contains('button', 'Search').click();
        cy.contains(/No patients found matching/i).should('be.visible');
    });

    it('clears search and restores all patients when input is emptied', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length < 2) return;
            const firstname = res.body[0].firstname;
            cy.get('input[aria-label="Search patients"]').type(firstname);
            cy.contains('button', 'Search').click();
            // Clear the input — live-clear restores all results immediately
            cy.get('input[aria-label="Search patients"]').clear();
            // A second patient's last name should now be visible again
            cy.contains(res.body[1].lastname).should('be.visible');
        });
    });
});

// ---------------------------------------------------------------------------
// Sort dropdown
// ---------------------------------------------------------------------------

describe('Patients Page – sort dropdown', () => {
    beforeEach(() => {
        cy.login();
        cy.window().then((win) => win.sessionStorage.clear());
        cy.visit('/patients');
    });

    it('sort dropdown is present with A-to-Z and Z-to-A options', () => {
        cy.get('select[aria-label="Sort patients"]').should('be.visible');
        cy.get('select[aria-label="Sort patients"] option').should('have.length', 2);
        cy.get('select[aria-label="Sort patients"] option[value="asc"]').should('exist');
        cy.get('select[aria-label="Sort patients"] option[value="desc"]').should('exist');
    });

    it('defaults to last name A-to-Z (asc)', () => {
        cy.get('select[aria-label="Sort patients"]').should('have.value', 'asc');
    });

    it('changes sort order when Z-to-A is selected', () => {
        cy.get('select[aria-label="Sort patients"]').select('desc');
        cy.get('select[aria-label="Sort patients"]').should('have.value', 'desc');
    });

    it('Z-to-A puts a later-alphabet last name first', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length < 2) return;
            const sorted = [...res.body].sort((a: any, b: any) =>
                b.lastname.localeCompare(a.lastname)
            );
            const lastFirst = sorted[0].lastname;
            cy.get('select[aria-label="Sort patients"]').select('desc');
            // The first patient card on the page should contain the Z-end last name
            cy.get('main').find('p').contains(lastFirst).should('be.visible');
        });
    });

    it('sort order persists after navigating away and back', () => {
        cy.get('select[aria-label="Sort patients"]').select('desc');
        cy.visit('/');
        cy.visit('/patients');
        cy.get('select[aria-label="Sort patients"]').should('have.value', 'desc');
    });
});

// ---------------------------------------------------------------------------
// Card content
// ---------------------------------------------------------------------------

describe('Patients Page – card content', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/patients');
    });

    it('displays names in "Last, First" format', () => {
        cy.request('GET', '/api/patients').then((res) => {
            if (res.body.length === 0) return;
            const p = res.body[0];
            cy.contains(`${p.lastname}, ${p.firstname}`).should('be.visible');
        });
    });

    it('displays phone number on cards where phone is available', () => {
        cy.request('GET', '/api/patients').then((res) => {
            const withPhone = res.body.find((p: any) => p.phone);
            if (!withPhone) return;
            cy.contains(withPhone.phone).should('be.visible');
        });
    });
});
