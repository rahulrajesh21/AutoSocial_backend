// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Mock environment variables that might be needed
process.env.DATABASE_URL = 'mock_database_url';
process.env.CLERK_SECRET_KEY = 'mock_clerk_secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Global setup
beforeAll(() => {
  // Any global setup code
  console.log('Starting tests...');
});

// Global teardown
afterAll(() => {
  // Any global cleanup code
  console.log('All tests completed.');
}); 