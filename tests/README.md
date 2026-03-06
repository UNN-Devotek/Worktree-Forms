# Test Architecture

This directory contains the expanded test infrastructure for Worktree.

## Structure

- **e2e/**: End-to-end tests using Playwright.
- **component/**: Component tests (Playwright Experimental or Vitest).
- **support/**: Shared helpers and fixtures.
  - **factories/**: Data factories using Faker.js.
  - **fixtures/**: Playwright fixtures (auth, api, etc).
  - **helpers/**: Generic utilities.

## Infrastructure

- **User Factory**: `tests/support/factories/user.factory.ts`
- **Auth Fixture**: `tests/support/fixtures/auth.fixture.ts` (Handles API seeding and Session Injection)
- **API Fixture**: `tests/support/fixtures/api.fixture.ts`

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/auth.spec.ts
```
