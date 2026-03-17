# End-to-End Testing with Cypress

This project includes comprehensive end-to-end tests using Cypress. These tests verify the functionality of all pages and components in the application.

## Setup

Cypress is already installed as a dev dependency. The configuration is located in `cypress.config.ts`.

## Running Cypress Tests

### Interactive Mode

Run tests in the Cypress Test Runner GUI where you can see tests execute in real-time:

```bash
npm run cypress:open
```

### Headless Mode

Run tests in the terminal without opening a browser GUI:

```bash
npm run cypress:run
```

### Headed Mode

Run tests in a headed browser (visible window) in headless mode:

```bash
npm run cypress:run:headed
```

## Test Files

The following test files are included in the `cypress/e2e` directory:

### 1. **login.cy.ts** - Login Page Tests

- Verifies the login page loads correctly
- Tests for GitHub sign-in button presence
- Validates login card structure
- Checks form and submit button functionality

### 2. **dashboard.cy.ts** - Dashboard Page Tests (Main Page)

- Tests the dashboard page loads with all content
- Verifies ART title and welcome message
- Validates navigation menu section with all items
- Tests descriptions for Home, Patients, Schedules, Claims, Credentialing, and Analytics
- Verifies ART Live Agent section
- Tests logo and navigation sidebar visibility

### 3. **patients.cy.ts** - Patients Page Tests

- Verifies the patients page loads correctly
- Tests page heading and description
- Validates page structure and hierarchy

### 4. **not-found.cy.ts** - 404 Error Pages Tests (Expected Failures)

- Tests that Schedules page returns 404
- Tests that Claims page returns 404
- Tests that Credentialing page returns 404
- Tests that Analytics page returns 404

**Note**: These tests expect 404 errors because these pages are not yet implemented.

### 5. **navigation.cy.ts** - Navigation Tests

- Tests navigation structure and accessibility
- Verifies logo visibility
- Tests heading hierarchy
- Validates responsive layout

### 6. **chatbot.cy.ts** - ART Chatbot Component Tests

- Tests chatbot button rendering
- Verifies chatbot positioning (bottom-right)
- Tests z-index for proper visibility
- Validates component structure

### 7. **accessibility.cy.ts** - Accessibility Tests

- Tests page structure with semantic HTML
- Verifies heading hierarchy
- Tests alt text on images
- Validates button labels and form structure

## Test Configuration

Configuration details in `cypress.config.ts`:

- **Base URL**: http://localhost:3000
- **Viewport**: 1280x720
- **Default Timeout**: 8 seconds
- **Page Load Timeout**: 30 seconds

## Prerequisites

Before running Cypress tests:

1. Make sure the development server is running:

   ```bash
   npm run dev
   ```

2. The application will be available at `http://localhost:3000`

3. Cypress will automatically connect to this URL when running tests

## Test Results

### Expected Pass

- Login page tests
- Dashboard page tests
- Patients page tests
- Navigation tests
- Chatbot tests
- Accessibility tests

### Expected Failure

- Not found tests (404 pages) for unimplemented pages:
  - /schedules
  - /claims
  - /credentialing
  - /analytics

These pages will show 404 errors because they haven't been created yet.

## Adding New Tests

To add new Cypress tests:

1. Create a new file in `cypress/e2e/` with the pattern `*.cy.ts`
2. Write your test cases using Cypress commands
3. Run `npm run cypress:open` to test interactively

Example test structure:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/path');
  });

  it('should do something', () => {
    cy.contains('Expected Text').should('be.visible');
  });
});
```

## Debugging Tests

When running in interactive mode (`npm run cypress:open`), you can:

- Step through tests
- Use the browser DevTools
- View network requests
- Inspect DOM elements
- Review test execution history

## CI/CD Integration

To run Cypress tests in CI/CD pipelines:

```bash
# Start dev server in background and run tests
npm run dev &
sleep 5 # Wait for server to start
npm run cypress:run
```

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library with Cypress](https://testing-library.com/docs/cypress-testing-library/intro/)
