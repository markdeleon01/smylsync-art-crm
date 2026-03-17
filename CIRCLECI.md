# CircleCI CI/CD Setup Guide

This project is configured with CircleCI for automated continuous integration and continuous deployment (CI/CD). The pipeline automatically runs on every push to the repository.

## Configuration

The CircleCI configuration is located in `.circleci/config.yml` and defines a complete pipeline with multiple jobs.

## Pipeline Overview

The CI/CD pipeline consists of the following jobs that run in sequence:

### 1. **install-and-cache**

- Installs npm dependencies
- Caches node_modules for faster builds
- Sets up workspace for subsequent jobs
- Node.js Version: 20.11

### 2. **unit-tests** (runs after install-and-cache)

- Runs all Vitest unit tests
- Tests:
  - Dashboard page tests (6 tests)
  - Patients page tests (6 tests)
  - Login page tests (6 tests)
  - ART chatbot component tests (21 tests)
- Total: 39 unit tests
- Stores test results and coverage reports

### 3. **type-check** (runs after install-and-cache)

- Runs TypeScript type checking with `tsc --noEmit`
- Ensures no type errors in the codebase
- Runs in parallel with unit-tests

### 4. **build** (runs after unit-tests and type-check pass)

- Builds the Next.js application
- Caches the `.next` build directory
- Stores build artifacts

### 5. **e2e-tests** (runs after build completes)

- Starts the development server
- Waits for server to be ready (60 second timeout)
- Runs Cypress end-to-end tests
- Tests:
  - Login page (5 tests)
  - Dashboard page (13 tests)
  - Patients page (5 tests)
  - Navigation pages - 404 tests (4 tests - expected to fail)
  - Navigation tests (5 tests)
  - Chatbot tests (4 tests)
  - Accessibility tests (6 tests)
- Total: 42 e2e tests
- Stores screenshots and videos for failed tests

## Workflow

The workflow `test-and-build` orchestrates all jobs:

```
install-and-cache
    ↓
    ├→ unit-tests
    │   ↓
    │   build
    │   ↓
    └ e2e-tests

    └→ type-check
```

**Execution:**

1. Dependencies are installed and cached
2. Unit tests and type checking run in parallel
3. Only if both pass, the build runs
4. After successful build, e2e tests run against the built application

## GitHub Integration

### Setting Up CircleCI with GitHub

1. **Connect Repository**
   - Go to [CircleCI](https://circleci.com)
   - Sign in with GitHub
   - Follow the project from your GitHub organization/account
   - Select the repository: `nextjs-postgres-nextauth-tailwindcss-template`

2. **Enable Project**
   - Click "Set Up Project"
   - Select "Fastest" (uses existing `.circleci/config.yml`)
   - Click "Set Up Project"

3. **Automatic Triggers**
   - The pipeline automatically triggers on:
     - Push to any branch
     - Pull requests
     - You can configure branch filters in the config

### Triggering Pipelines

Pipelines run automatically when you:

- Push commits to the repository
- Create pull requests
- Push to any branch

Example:

```bash
git push origin main        # Triggers pipeline on main branch
git push origin feature-x   # Triggers pipeline on feature-x branch
```

## Viewing Pipeline Results

### On CircleCI Dashboard

1. Go to [app.circleci.com](https://app.circleci.com)
2. Select your project
3. View:
   - Pipeline status and progress
   - Individual job details
   - Test results
   - Build artifacts
   - Logs for debugging

### On GitHub

1. Go to your repository
2. Click "Actions" tab
3. Or view status on individual commits and pull requests

## Test Results

### Expected Passing Tests

- ✅ All unit tests (39 tests)
- ✅ Type checking
- ✅ Build compilation
- ✅ Most e2e tests (38 out of 42 tests pass)

### Expected Failing Tests (4 tests)

The following e2e tests are expected to fail because the pages return 404 errors (not yet implemented):

- ❌ `should show 404 for Schedules page` - `/schedules`
- ❌ `should show 404 for Claims page` - `/claims`
- ❌ `should show 404 for Credentialing page` - `/credentialing`
- ❌ `should show 404 for Analytics page` - `/analytics`

These failures are expected and intentional. The pipeline does not fail overall if these specific tests fail.

## Artifacts

CircleCI stores the following artifacts from each pipeline run:

### From unit-tests job

- `coverage/` - Code coverage reports
- `test-results/` - Vitest test results

### From build job

- `.next/` - Next.js build output

### From e2e-tests job

- `cypress/screenshots/` - Screenshots of failed tests
- `cypress/videos/` - Screen recordings of test execution

These artifacts can be viewed in the CircleCI UI under each job's "Artifacts" tab.

## Caching Strategy

The configuration uses caching to speed up subsequent builds:

1. **npm dependencies** - Cached after `install-and-cache` job
   - Key: `node-modules-{{ checksum "package-lock.json" }}`
   - Restored in all subsequent jobs

2. **Next.js build** - Cached after `build` job
   - Key: `next-build-{{ .Environment.CIRCLE_SHA1 }}`
   - Used by `e2e-tests` job to avoid rebuilding

This significantly speeds up pipeline execution for unchanged code.

## Customization

### Modifying the Pipeline

To modify the pipeline:

1. Edit `.circleci/config.yml`
2. Commit and push changes
3. CircleCI automatically uses the new configuration

### Common Modifications

**Change Node.js version:**

```yaml
executor:
  name: node/default
  tag: '20.11' # Change this version
```

**Add a new job:**

```yaml
jobs:
  new-job:
    executor:
      name: node/default
      tag: '20.11'
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Do something
          command: your-command-here
```

**Add job to workflow:**

```yaml
workflows:
  test-and-build:
    jobs:
      - install-and-cache
      - new-job:
          requires:
            - install-and-cache
```

## Troubleshooting

### Pipeline Fails with "No such file or directory"

**Cause:** Workspace not properly attached
**Solution:** Ensure each job that needs files has `attach_workspace` step

### Tests timeout

**Cause:** Server takes too long to start or tests are slow
**Solution:** Increase timeout in config:

```yaml
- run:
    command: npx wait-on http://localhost:3000 --timeout 120000
```

### Build fails with dependency errors

**Cause:** package-lock.json is out of sync
**Solution:** Update package-lock.json locally and commit:

```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### e2e tests fail with connection refused

**Cause:** Dev server didn't start properly
**Solution:** Check dev server logs in CircleCI UI and verify ports are available

## Status Badges

You can add a CircleCI status badge to your README:

```markdown
[![CircleCI](https://circleci.com/gh/YOUR-ORG/YOUR-REPO.svg?style=svg)](https://circleci.com/gh/YOUR-ORG/YOUR-REPO)
```

Replace:

- `YOUR-ORG` with your GitHub organization/username
- `YOUR-REPO` with the repository name

## Environment Variables

To add secrets or environment variables in CircleCI:

1. Go to Project Settings in CircleCI
2. Click "Environment Variables"
3. Add variables (e.g., API keys, database URLs)
4. Reference in config using `$VARIABLE_NAME`

Example in config:

```yaml
- run:
    command: echo $MY_SECRET_VAR
```

## Resources

- [CircleCI Documentation](https://circleci.com/docs/)
- [CircleCI Config Reference](https://circleci.com/docs/configuration-reference/)
- [Node Orb Documentation](https://circleci.com/docs/node-orb/)
- [CircleCI Best Practices](https://circleci.com/docs/best-practices/)

## Support

For more information:

- Check CircleCI logs for detailed error messages
- Review the configuration guide above
- Consult CircleCI documentation for advanced features
