<div align="center"><strong>SMYLSYNC - Admin Dashboard with AI-Powered ART Assistant</strong></div>
<div align="center">Built with Next.js 16, TypeScript, and Shadcn UI</div>
<br />
<div align="center">
<a href="#features">Features</a>
<span> · </span>
<a href="#getting-started">Getting Started</a>
<span> · </span>
<a href="#testing">Testing</a>
<span> · </span>
<a href="#cicd-pipeline">CI/CD Pipeline</a>
</div>

## Overview

SMYLSYNC is a modern healthcare admin dashboard template featuring an AI-powered Assistant (ART - Admin Rescue Tool) and comprehensive testing infrastructure. Built with the latest web technologies and production-ready configurations.

### Tech Stack

**Core Technologies:**

- Framework - [Next.js 16.1.6](https://nextjs.org) with App Router and Turbopack
- Language - [TypeScript 5.7.2](https://www.typescriptlang.org)
- Styling - [Tailwind CSS 3.4.17](https://tailwindcss.com)
- UI Components - [Shadcn UI](https://ui.shadcn.com/) with Lucide React icons
- Authentication - [NextAuth.js 5.0.0-beta.30](https://authjs.dev) (GitHub OAuth)
- Database - [PostgreSQL via Neon](https://vercel.com/postgres)
- Formatting - [Prettier](https://prettier.io)

**AI & Tools:**

- AI Integration - [Vercel AI SDK](https://sdk.vercel.ai)
- MCP Support - [Model Context Protocol SDK](https://modelcontextprotocol.io)
- Analytics - [Vercel Analytics](https://vercel.com/analytics)

**Testing & Quality:**

- Unit Testing - [Vitest 4.1.0](https://vitest.dev)
- E2E Testing - [Cypress 15.12.0](https://www.cypress.io)
- Type Safety - TypeScript with strict mode
- CI/CD - [CircleCI](https://circleci.com)

## Features

- 🤖 **ART Chatbot** - AI-powered Admin Rescue Tool assistant in the dashboard
- 📊 **Interactive Dashboard** - Clean, intuitive admin interface
- 🔐 **GitHub OAuth** - Secure authentication
- 📱 **Responsive Design** - Mobile-friendly layouts
- 🧪 **Comprehensive Tests** - 39 unit tests + 42 e2e tests
- 🔄 **CI/CD Pipeline** - Automated testing and deployment with CircleCI
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS
- 📈 **Analytics** - Integrated Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ (tested with 20.11)
- npm or pnpm package manager
- GitHub account (for OAuth setup)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd nextjs-postgres-nextauth-tailwindcss-template
npm install
```

2. **Environment Setup:**

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following in `.env`:

- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Set to `http://localhost:8080` for development
- `GITHUB_ID` and `GITHUB_SECRET` - From GitHub OAuth app
- Database credentials (if using PostgreSQL)

3. **Database Setup (Optional):**

For Postgres database, Set database environment variables in `.env`:

- `DATABASE_URL` - PostgreSQL connection string

4. **Start Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

```bash
npm run dev           # Start development server with Turbopack
npm run build         # Build for production
npm run start         # Start production server
npm run test          # Run unit tests in watch mode
npm run test:ui       # Run tests with Vitest UI dashboard
npm run test:coverage # Generate test coverage report
```

## Testing

This project includes comprehensive testing infrastructure with both unit tests and end-to-end tests to ensure code quality and functionality.

### Unit Tests with Vitest

Vitest is used for fast, reliable unit tests with excellent TypeScript support.

**Running Unit Tests:**

```bash
npm run test              # Watch mode
npm run test:ui           # Interactive Vitest UI dashboard
npm run test:coverage     # Generate coverage reports
```

**Test Files:**

| Test File             | Tests  | Coverage                                     |
| --------------------- | ------ | -------------------------------------------- |
| Dashboard page        | 6      | Rendering, menu display, content             |
| Patients page         | 6      | Page loading, content structure              |
| Login page            | 6      | Auth UI, form structure                      |
| ART Chatbot component | 21     | Toggle, messages, persistence, accessibility |
| **Total**             | **39** | **All major components**                     |

**Test Configuration:**

- Environment: jsdom (browser simulation)
- Setup file: `vitest.setup.ts` (mocks, utilities)
- Type support: Full TypeScript support
- Test discovery: `**/*.test.{ts,tsx}`

### End-to-End Tests with Cypress

Cypress manages end-to-end testing with real browser automation.

**Running E2E Tests:**

```bash
npm run cypress:open           # Interactive test runner
npm run cypress:run            # Headless execution
npm run cypress:run:headed     # Headed browser mode
```

**Test Coverage:**

| Test Suite      | Tests  | Type                                       |
| --------------- | ------ | ------------------------------------------ |
| Login page      | 5      | Form interaction, navigation               |
| Dashboard page  | 13     | Content, menu items, layout                |
| Patients page   | 5      | Page structure, data display               |
| Navigation      | 5      | Menu structure, responsive design          |
| Chatbot         | 4      | Component rendering, positioning           |
| Accessibility   | 6      | Semantic HTML, ARIA, alt text              |
| Not Found (404) | 4      | ❌ Expected failures - unimplemented pages |
| **Total**       | **42** | **38 passing, 4 expected failures**        |

**Configuration:**

- Base URL: `http://localhost:8080`
- Viewport: 1280x720
- Default timeout: 8 seconds
- Page load timeout: 30 seconds

**Prerequisites:**

Before running Cypress tests, start the development server:

```bash
npm run dev
```

Then in another terminal:

```bash
npm run cypress:open    # or npm run cypress:run
```

### Type Checking

Verify TypeScript types without compilation:

```bash
npx tsc --noEmit
```

## CI/CD Pipeline

### CircleCI Integration

This project is fully configured with CircleCI for automated continuous integration and deployment. The pipeline runs automatically on every push to the repository.

**Configuration File:** `.circleci/config.yml`

### Pipeline Jobs

The pipeline executes 5 interconnected jobs:

1. **install-and-cache** (1-2 minutes)
   - Installs npm dependencies
   - Caches node_modules for faster builds
   - Node.js 20.11
   - Sets up workspace for downstream jobs

2. **unit-tests** (1-2 minutes, runs after install-and-cache)
   - Executes all 39 Vitest tests
   - Stores test results and coverage reports
   - Artifacts: `test-results/`, `coverage/`

3. **type-check** (30-60 seconds, runs parallel with unit-tests)
   - TypeScript type verification with `tsc --noEmit`
   - Ensures no type errors in codebase

4. **build** (2-3 minutes, requires unit-tests + type-check)
   - Compiles Next.js application
   - Caches `.next` directory by commit SHA
   - Stores build artifacts

5. **e2e-tests** (3-5 minutes, requires build)
   - Starts development server
   - Waits for server readiness (60 second timeout)
   - Runs 42 Cypress tests
   - Captures screenshots and videos for failures
   - Artifacts: `cypress/screenshots/`, `cypress/videos/`

**Total Pipeline Time:** 7-12 minutes (depending on system load)

### Workflow Orchestration

```
install-and-cache
    ├→ unit-tests ──┐
    │               ├→ build ──→ e2e-tests
    └→ type-check ──┘
```

### Expected Test Results

**Passing:**

- ✅ 39 Unit tests (100%)
- ✅ Type checking (100%)
- ✅ Build compilation (100%)
- ✅ 38 E2E tests (90.5%)

**Expected Failures (4 tests):**

- ❌ Schedules page (404 - not implemented)
- ❌ Claims page (404 - not implemented)
- ❌ Credentialing page (404 - not implemented)
- ❌ Analytics page (404 - not implemented)

### Setup Instructions

1. **Connect Repository to CircleCI:**
   - Go to [CircleCI](https://circleci.com)
   - Sign in with your GitHub account
   - Click "Setup project"
   - Select this repository
   - Choose "Fastest" (uses existing `.circleci/config.yml`)

2. **Enable Automatic Triggers:**
   - Pipeline automatically triggers on:
     - Push to any branch
     - Pull request creation
   - View results on CircleCI dashboard and GitHub

3. **Monitor Results:**
   - **CircleCI Dashboard:** [app.circleci.com](https://app.circleci.com)
   - **GitHub:** View status on commits and pull requests
   - **Artifacts:** Test results, coverage, screenshots, videos

### Environment Variables (Optional)

For additional CI/CD customization, set in CircleCI project settings:

```
NODE_ENV=test
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Caching Strategy

- **npm dependencies:** Keyed by `package-lock.json`
- **Next.js build:** Keyed by commit SHA
- Caches shared across all jobs for performance

### Customization

See [CIRCLECI.md](./CIRCLECI.md) for:

- Custom environment variables
- Modifying pipeline stages
- Adding new jobs
- Slack/email notifications
- Branch-specific configurations

## Documentation

Comprehensive guides are available:

- **[CYPRESS.md](./CYPRESS.md)** - Detailed Cypress testing guide with all test descriptions
- **[CIRCLECI.md](./CIRCLECI.md)** - Complete CircleCI setup and troubleshooting guide
- **[CIRCLECI_SETUP.md](./CIRCLECI_SETUP.md)** - Quick setup verification checklist

## Project Structure

```
.circleci/
  └── config.yml              # CircleCI pipeline configuration

app/
  ├── api/                    # API routes
  ├── login/                  # Login page
  └── (dashboard)/            # Dashboard layout and pages
      ├── page.tsx            # Dashboard home (ART chatbot)
      ├── page.test.tsx       # Dashboard tests
      ├── patients/
      │   ├── page.tsx        # Patients page
      │   └── page.test.tsx    # Patients tests
      └── layout.tsx          # Dashboard layout with navigation

components/
  ├── art/                    # ART chatbot component
  │   ├── index.tsx
  │   └── index.test.tsx
  ├── ui/                     # Shadcn UI components
  ├── logo.tsx                # SMYLSYNC logo
  └── icons.tsx              # Icon components

cypress/
  ├── e2e/                    # E2E test files
  │   ├── login.cy.ts
  │   ├── dashboard.cy.ts
  │   ├── patients.cy.ts
  │   ├── navigation.cy.ts
  │   ├── chatbot.cy.ts
  │   ├── accessibility.cy.ts
  │   └── not-found.cy.ts
  ├── support/                # Cypress configuration
  └── config.ts

lib/
  ├── db.ts                   # Database connection
  ├── auth.ts                 # Authentication setup
  ├── hooks/
  │   └── useChat.ts         # AI chat hook
  └── services/               # Business logic

public/
  └── smylsync-logo.svg      # Logo asset

vitest.config.ts            # Vitest configuration
vitest.setup.ts             # Test setup and mocks
cypress.config.ts           # Cypress configuration
tsconfig.json               # TypeScript configuration
tailwind.config.ts          # Tailwind CSS configuration
next.config.ts              # Next.js configuration
```

## Dependencies

### Production Dependencies (36)

Key packages include:

- next, react, react-dom, typescript
- next-auth, @neondatabase/serverless
- @ai-sdk/openai, @ai-sdk/react, @modelcontextprotocol/sdk
- @radix-ui (dialog, dropdown, tooltip, tabs)
- tailwindcss, lucide-react, shadcn components

### Development Dependencies (10)

Testing and build tools:

- vitest, @vitest/ui, cypress
- @testing-library (react, dom, jest-dom, user-event, cypress)
- vite, @vitejs/plugin-react, jsdom, wait-on

## Contributing

Contributions are welcome! Please:

1. Create a feature branch
2. Write or update tests
3. Ensure all tests pass locally
4. Submit a pull request

## License

Licensed under the MIT License - see LICENSE.md for details.

## Support

For issues and questions:

- Check documentation files
- Review test examples in `cypress/e2e/` and `**/*.test.tsx`
- Consult [CIRCLECI.md](./CIRCLECI.md) for CI/CD issues
- Consult [CYPRESS.md](./CYPRESS.md) for testing issues

---

**Happy coding!** 🚀
