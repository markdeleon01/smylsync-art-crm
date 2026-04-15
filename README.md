<div align="center"><strong>SMYLSYNC - Dental CRM with AI-Powered ART Assistant</strong></div>
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

SMYLSYNC is a dental practice CRM and admin dashboard featuring an AI-powered operations agent (ART — Admin Rescue Tool) backed by a full Model Context Protocol (MCP) server. Staff can manage patients and appointments through the UI or by conversing with ART, which can look up records, book/rebook/cancel appointments, send email notifications, and auto-fill the schedule. Built with the latest web technologies and production-ready configurations.

### Tech Stack

**Core Technologies:**

- Framework - [Next.js 16](https://nextjs.org) with App Router and Turbopack
- Language - [TypeScript 5.7.2](https://www.typescriptlang.org)
- Styling - [Tailwind CSS 3.4.17](https://tailwindcss.com)
- UI Components - [Shadcn UI](https://ui.shadcn.com/) with Lucide React icons
- Authentication - Custom JWT with email/password
- Database - [PostgreSQL via Neon](https://neon.tech) with [Drizzle ORM](https://orm.drizzle.team)
- Deployment - [Netlify](https://netlify.com) (Next.js plugin + scheduled functions)
- Formatting - [Prettier](https://prettier.io)

**AI & MCP:**

- AI SDK - [Vercel AI SDK v6](https://sdk.vercel.ai) (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`, `@ai-sdk/mcp`)
- LLM - OpenAI GPT-5-nano (via `@ai-sdk/openai`)
- MCP Server - [Model Context Protocol SDK](https://modelcontextprotocol.io) (`@modelcontextprotocol/sdk`) — stateless HTTP transport, 28 registered tools
- Analytics - [Vercel Analytics](https://vercel.com/analytics)

**Email:**

- [Nodemailer](https://nodemailer.com) over SMTP — booking confirmations, rescheduling notices, cancellation notices, and 24-hour reminder emails
- Automated reminders via GitHub Actions cron job running every hour

**Testing & Quality:**

- Unit Testing - [Vitest 4.1.x](https://vitest.dev)
- E2E Testing - [Cypress 15.12.0](https://www.cypress.io)
- Type Safety - TypeScript with strict mode
- CI/CD - [CircleCI](https://circleci.com)

## Features

- 🤖 **ART Agent** - AI operations agent that can read and write patient/appointment data through MCP tools, ask for confirmation before destructive actions, and chain up to 5 tool calls per turn
- 🗓️ **Schedules Calendar** - Week/day/month calendar view of all appointments with colour-coded appointment types
- 👥 **Patient Management** - Browse, search, sort, and view patients with their upcoming appointments; full CRUD via ART
- 📧 **Email Notifications** - Booking confirmations, rescheduling notices, cancellation notices, and automated 24-hour reminders
- 🔐 **Authentication** - Secure login with email and password for staff access
- 📱 **Responsive Design** - Mobile-friendly layouts with responsive sidebar navigation
- 🧪 **Comprehensive Tests** - 224 unit tests + 114 e2e tests
- 🔄 **CI/CD Pipeline** - Automated testing and deployment with CircleCI
- 🎨 **Modern UI** - Shadcn UI components with Tailwind CSS

## MCP Tools

The ART agent is powered by a Model Context Protocol (MCP) server with 28 registered tools for managing dental practice operations. The server is stateless and uses HTTP transport.

### Patient Management Tools (14 tools)

- `get_all_patients` - Retrieve all patient records
- `get_patient_by_id` - Get patient by ID
- `get_patients_by_lastname` - Search patients by last name
- `get_patients_by_firstname` - Search patients by first name
- `get_patient_by_email` - Get patient by email
- `update_patient_firstname` - Update patient's first name
- `update_patient_lastname` - Update patient's last name
- `update_patient_email` - Update patient's email
- `update_patient_phone` - Update patient's phone number
- `create_new_patient` - Create a new patient record
- `delete_patient_by_id` - Delete patient by ID
- `delete_patient_by_lastname` - Delete patients by last name
- `delete_patient_by_firstname` - Delete patients by first name
- `delete_patient_by_email` - Delete patient by email

### Appointment Management Tools (14 tools)

- `get_all_appointments` - Retrieve all appointments
- `get_appointment_by_id` - Get appointment by ID
- `get_appointments_by_patient` - Get appointments for a patient
- `get_appointments_by_date` - Get appointments on a specific date
- `get_available_slots` - Find available time slots
- `book_appointment` - Book a new appointment
- `rebook_appointment` - Reschedule an existing appointment
- `cancel_appointment` - Cancel an appointment
- `complete_appointment` - Mark appointment as completed
- `send_reminder` - Send manual reminder email
- `send_booking_confirmation` - Send booking confirmation email
- `send_rescheduling_notification` - Send rescheduling notification
- `send_cancellation_notice` - Send cancellation notice
- `autofill_schedule` - Auto-fill schedule with overdue patients

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) package manager (`npm install -g pnpm`)
- PostgreSQL database (e.g. [Neon](https://neon.tech) free tier)
- OpenAI API key
- SMTP credentials for email (optional but required for email features)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd smylsync-art-crm
pnpm install
```

2. **Environment Setup:**

Create a `.env` file in the project root and configure the following variables:

```bash
# Database
DATABASE_URL=         # PostgreSQL connection string (e.g. Neon)

# AI
OPENAI_API_KEY=       # OpenAI API key

# Authentication
BCRYPT_SALT_ROUNDS=12
BCRYPT_PEPPER=        # Random string for password hashing
JWT_SECRET=           # Random string for JWT signing

# Email (optional — emails are silently skipped if omitted)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=            # e.g. noreply@yourdomain.com
SMTP_FROM_NAME=       # e.g. SMYLSYNC

# Clinic business hours shown in Schedules and used for open-slot generation
# Format: HH:MM-HH:MM or "closed"
CLINIC_HOURS_MONDAY=08:00-17:00
CLINIC_HOURS_TUESDAY=08:00-17:00
CLINIC_HOURS_WEDNESDAY=08:00-17:00
CLINIC_HOURS_THURSDAY=08:00-17:00
CLINIC_HOURS_FRIDAY=08:00-17:00
CLINIC_HOURS_SATURDAY=08:00-17:00
CLINIC_HOURS_SUNDAY=08:00-17:00

# Automated reminders (required for the GitHub Actions cron job)
CRON_SECRET=          # Any strong random string
URL=                  # Public base URL in production (set automatically by Netlify)
```

3. **Database Setup:**

Run migrations then seed initial data:

```bash
pnpm run migrate
pnpm run seed:users
pnpm run seed:patients
```

4. **Start Development Server:**

```bash
pnpm run dev
```

The application will be available at `http://localhost:8080`.

### Setting up Automated Reminders

Since Netlify scheduled functions require a paid plan, automated appointment reminders are handled via GitHub Actions:

1. **Set up GitHub Secrets:**

   - Go to your repository Settings → Secrets and variables → Actions
   - Add `SITE_URL`: Your deployed Netlify site URL (e.g., `https://your-site.netlify.app`)
   - Add `CRON_SECRET`: The same value as your `CRON_SECRET` environment variable

2. **The workflow will automatically run every hour** to send appointment reminders.

**Note:** The `/api/reminders` endpoint is configured as a public API route that accepts Bearer token authentication for automated cron jobs.

### Available Scripts

```bash
pnpm run dev              # Start development server with Turbopack
pnpm run build            # Build for production
pnpm run start            # Start production server
pnpm run migrate          # Run database migrations (requires .env)
pnpm run seed:users       # Seed initial user accounts (requires .env)
pnpm run seed:patients    # Seed patient records (requires .env)
pnpm run test             # Run unit tests in watch mode
pnpm run test:ui          # Run tests with Vitest UI dashboard
pnpm run test:coverage    # Generate test coverage report
pnpm run cypress:open     # Open Cypress interactive test runner
pnpm run cypress:run      # Run Cypress tests headlessly
pnpm run cypress:run:headed  # Run Cypress tests in a headed browser
```

## Testing

This project includes 224 unit tests and 114 e2e tests covering all major components, API routes, and service layers.

### Unit Tests with Vitest

**Running Unit Tests:**

```bash
pnpm run test              # Watch mode
pnpm run test:ui           # Interactive Vitest UI dashboard
pnpm run test:coverage     # Generate coverage reports
```

**Test Files:**

| Test File                                         | Tests   | Coverage                                             |
| ------------------------------------------------- | ------- | ---------------------------------------------------- |
| `lib/services/appointments.test.ts`               | 35      | Booking, rebooking, cancellation, availability       |
| `app/(dashboard)/patients/patients-list.test.tsx` | 49      | Rendering, search, sort, badges, bubble, persistence |
| `app/api/[transport]/route.test.ts`               | 30      | MCP server tools — patients & appointments           |
| `lib/services/patients.test.ts`                   | 12      | Patient CRUD operations                              |
| `components/art/index.test.tsx`                   | 21      | Toggle, messages, persistence, accessibility         |
| `app/api/reminders/route.test.ts`                 | 8       | Auth guard, reminder dispatch, edge cases            |
| `lib/services/email.test.ts`                      | 9       | Email sending, SMTP fallback                         |
| `app/(dashboard)/patients/page.test.tsx`          | 11      | Page loading, content structure                      |
| `app/(dashboard)/loading-spinner.test.tsx`        | 7       | Spinner rendering and accessibility                  |
| `app/(dashboard)/schedules/actions.test.ts`       | 19      | Server actions for calendar data                     |
| `app/(dashboard)/schedules/page.test.tsx`         | 5       | Schedules page rendering                             |
| `app/(dashboard)/page.test.tsx`                   | 6       | Dashboard home rendering                             |
| `app/login/page.test.tsx`                         | 6       | Auth UI, form structure                              |
| `app/api/patients/route.test.ts`                  | 3       | Patients API GET/POST                                |
| `app/api/patients/[id]/route.test.ts`             | 3       | Patients API GET/PATCH/DELETE by ID                  |
| **Total**                                         | **224** | **All major components, routes, and services**       |

**Test Configuration:**

- Environment: jsdom (browser simulation)
- Setup file: `vitest.setup.ts`
- Test discovery: `**/*.test.{ts,tsx}` (excludes `node_modules`)

### End-to-End Tests with Cypress

**Running E2E Tests:**

```bash
pnpm run cypress:open          # Interactive test runner
pnpm run cypress:run           # Headless execution
pnpm run cypress:run:headed    # Headed browser mode
```

Start the dev server before running Cypress:

```bash
pnpm run dev   # in one terminal
pnpm run cypress:open   # in another terminal
```

**Test Coverage:**

| Test Suite      | Tests   | Type                                            |
| --------------- | ------- | ----------------------------------------------- |
| Schedules       | 42      | Calendar views, navigation, appointment display |
| Patients        | 32      | List, search, sort, appointment badges, bubble  |
| Dashboard       | 13      | Content, navigation menu, layout                |
| Accessibility   | 6       | Semantic HTML, ARIA, alt text                   |
| Navigation      | 8       | Menu structure, responsive sidebar              |
| Login           | 5       | Form interaction, redirect                      |
| Not Found / 404 | 4       | Graceful fallback for unimplemented routes      |
| Chatbot         | 4       | ART component rendering and positioning         |
| **Total**       | **114** | **All implemented pages and key user flows**    |

**Configuration:**

- Base URL: `http://localhost:8080`
- Viewport: 1280x720
- Default timeout: 8 seconds
- Page load timeout: 30 seconds

### Type Checking

```bash
npx tsc --noEmit
```

## CI/CD Pipeline

### CircleCI Integration

The pipeline runs automatically on every push to the repository.

**Configuration File:** `.circleci/config.yml`

### Pipeline Jobs

The pipeline executes 5 interconnected jobs:

1. **install-and-cache** (1-2 minutes)

   - Installs pnpm dependencies and caches `node_modules`
   - Node.js 20.11

2. **unit-tests** (2-4 minutes, runs after install-and-cache)

   - Executes all 224 Vitest tests
   - Stores test results and coverage reports
   - Artifacts: `test-results/`, `coverage/`

3. **type-check** (30-60 seconds, parallel with unit-tests)

   - TypeScript verification with `tsc --noEmit`

4. **build** (2-3 minutes, requires unit-tests + type-check)

   - Compiles the Next.js application
   - Caches `.next` directory by commit SHA

5. **e2e-tests** (5-8 minutes, requires build)
   - Starts the development server and waits for readiness
   - Runs all 114 Cypress tests
   - Artifacts: `cypress/screenshots/`, `cypress/videos/`

**Total Pipeline Time:** 10-15 minutes (depending on system load)

### Workflow Orchestration

```
install-and-cache
    ├→ unit-tests ──┐
    │               ├→ build ──→ e2e-tests
    └→ type-check ──┘
```

### Expected Test Results

- ✅ 224 Unit tests (100%)
- ✅ Type checking (100%)
- ✅ Build compilation (100%)
- ✅ 114 E2E tests (100%)

### Setup Instructions

1. **Connect Repository to CircleCI:**

   - Go to [CircleCI](https://circleci.com) and sign in with GitHub
   - Click "Setup project" and select this repository
   - Choose "Fastest" (uses existing `.circleci/config.yml`)

2. **Set Environment Variables in CircleCI:**

   In the CircleCI project settings, add the same variables from your `.env` file. At minimum, `DATABASE_URL`, `OPENAI_API_KEY`, and `JWT_SECRET` are required for the build to succeed.

3. **Monitor Results:**
   - **CircleCI Dashboard:** [app.circleci.com](https://app.circleci.com)
   - **GitHub:** Status checks on commits and pull requests
   - **Artifacts:** Test results, coverage reports, Cypress screenshots/videos

### Caching Strategy

- **pnpm dependencies:** Keyed by `pnpm-lock.yaml`
- **Next.js build:** Keyed by commit SHA
- Caches shared across all jobs for performance

### Customization

See [CIRCLECI.md](./CIRCLECI.md) for modifying pipeline stages, adding jobs, and configuring notifications.

## Documentation

- **[CYPRESS.md](./CYPRESS.md)** - Cypress testing guide with all test descriptions
- **[CIRCLECI.md](./CIRCLECI.md)** - CircleCI setup and troubleshooting guide
- **[CIRCLECI_SETUP.md](./CIRCLECI_SETUP.md)** - Quick setup verification checklist

## Project Structure

```
app/
  ├── api/
  │   ├── [transport]/        # MCP server (stateless HTTP, 28 tools)
  │   ├── art/                # ART chat endpoint (streamText + MCP client)
  │   ├── appointments/       # Appointments REST API
  │   ├── patients/           # Patients REST API
  │   └── reminders/          # Cron-triggered reminder dispatcher
  ├── login/                  # Login page
  └── (dashboard)/
      ├── page.tsx            # Dashboard home
      ├── layout.tsx          # Sidebar navigation layout
      ├── patients/
      │   ├── page.tsx        # Patient list with search, sort, and appointment badges
      │   ├── patients-list.tsx
      │   └── *.test.*
      └── schedules/
          ├── page.tsx        # Schedules page
          ├── calendar.tsx    # Week/day/month calendar component
          ├── actions.ts      # Server actions for calendar data
          └── *.test.*

components/
  ├── art/                    # ART chatbot component
  └── ui/                     # Shadcn UI components

lib/
  ├── db.ts                   # Neon/Postgres connection
  ├── types.ts                # Shared types (Patient, Appointment, APPOINTMENT_TYPES)
  ├── hooks/
  │   └── useChat.ts          # AI chat hook
  └── services/
      ├── appointments.ts     # Appointment CRUD, availability, autofill, reminders
      ├── patients.ts         # Patient CRUD
      └── email.ts            # Nodemailer email helpers

netlify/
  └── functions/
      └── send-reminders.ts   # Legacy Netlify function (scheduled functions require paid plan)

.github/
  └── workflows/
      └── send-reminders.yml  # GitHub Actions workflow for automated reminders

scripts/
  ├── migrate.ts              # Run database migrations
  └── seed-users.ts           # Seed initial user accounts

cypress/
  └── e2e/                    # End-to-end test suites

vitest.config.mts             # Vitest configuration
vitest.setup.ts               # Test setup and global mocks
cypress.config.ts             # Cypress configuration
netlify.toml                  # Netlify build + functions config
next.config.ts                # Next.js configuration
tailwind.config.ts            # Tailwind CSS configuration
```

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
