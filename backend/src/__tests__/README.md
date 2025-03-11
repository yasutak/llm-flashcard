# LLM Flashcard Backend Test Suite

This directory contains the test suite for the LLM Flashcard backend application. The tests are organized by module type, with separate directories for services, routes, utils, and middleware.

## Test Structure

- `__tests__/services/`: Tests for service modules that interact with external APIs
- `__tests__/routes/`: Tests for API route handlers
- `__tests__/utils/`: Tests for utility functions
- `__tests__/middleware/`: Tests for middleware functions

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers the following key functionality:

### Claude Service Tests

- API key verification
- Sending messages to Claude
- Generating flashcards from conversations

### User Routes Tests

- Storing and validating API keys
- Checking if a user has an API key

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate the code being tested:

- External API calls (e.g., to Anthropic's Claude API) are mocked to avoid actual network requests
- Database operations are mocked to avoid actual database interactions
- Encryption and JWT operations are mocked for security and isolation

## Adding New Tests

When adding new functionality to the backend, please follow these guidelines for adding tests:

1. Create test files with the `.test.ts` extension
2. Place tests in the appropriate directory based on the module type
3. Use descriptive test names that explain what is being tested
4. Mock external dependencies to isolate the code being tested
5. Test both success and failure cases

## Continuous Integration

The test suite is integrated with the CI/CD pipeline and runs automatically on each pull request and push to the main branch.
