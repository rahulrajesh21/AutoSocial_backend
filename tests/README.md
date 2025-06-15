# AutoSocial Backend Tests

This directory contains tests for the AutoSocial backend application. The tests are organized into unit tests and integration tests.

## Directory Structure

```
tests/
├── unit/               # Unit tests for individual components
├── integration/        # Integration tests for API endpoints
├── mocks/              # Mock implementations for testing
└── README.md           # This file
```

## Test Setup

The tests use Jest as the testing framework and Supertest for API testing. The setup is defined in `jest.setup.js` at the root of the project.

### Mock Implementations

Mock implementations are provided for:
- Database queries (`tests/mocks/database.mock.js`)
- Clerk authentication (`tests/mocks/clerk.mock.js`)

## Running Tests

To run all tests:

```bash
npm test
```

To run tests with coverage report:

```bash
npm run test:coverage
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

## Current Test Coverage

The current test coverage focuses on:

1. **WorkflowController**: Tests for creating, retrieving, and updating workflows (78.57% line coverage)
2. **AutomationController**: Tests for creating automations and processing flow data (72.28% line coverage)
3. **exampleController**: Tests for the example data operations (100% line coverage)
4. **Workflow Routes**: Integration tests for workflow API endpoints (100% line coverage)
5. **Instagram Routes**: Integration tests for Instagram API endpoints (84.37% line coverage)

Overall coverage: 33.88% of lines

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Unit Tests**:
   - Place in the `tests/unit/` directory
   - Name files with `.test.js` suffix
   - Mock external dependencies
   - Focus on testing a single component in isolation

2. **Integration Tests**:
   - Place in the `tests/integration/` directory
   - Name files with `.test.js` suffix
   - Test the interaction between components
   - Focus on API endpoints and request/response handling

3. **Mocks**:
   - Add new mock implementations to the `tests/mocks/` directory
   - Keep mocks simple and focused on the behavior needed for tests

## Areas for Improvement

The following areas need additional test coverage:

1. **ScheduleAutomation**: Currently at 10.52% line coverage
2. **Utility Functions**: The utility modules have very low coverage
   - PageUtils.js: 12.74%
   - geminiUtils.js: 18.18%
   - instagramUtils.js: 6.97%
3. **Error Handling**: More tests for error conditions and edge cases

## Best Practices

1. Use the AAA pattern (Arrange, Act, Assert) for test structure
2. Keep tests independent and idempotent
3. Mock external dependencies
4. Test both success and failure paths
5. Use descriptive test names that explain the expected behavior 