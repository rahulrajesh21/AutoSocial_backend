// Mock for Clerk authentication
const mockGetAuth = jest.fn().mockImplementation(() => {
  return {
    userId: 'user_test123',
    sessionId: 'session_test123',
    session: {
      id: 'session_test123',
      userId: 'user_test123'
    },
    user: {
      id: 'user_test123',
      username: 'testuser',
      emailAddresses: [
        { emailAddress: 'test@example.com' }
      ]
    }
  };
});

const mockRequireAuth = jest.fn().mockImplementation((req, res, next) => {
  req.auth = {
    userId: 'user_test123',
    sessionId: 'session_test123'
  };
  req.user = {
    id: 'user_test123',
    username: 'testuser',
    emailAddresses: [
      { emailAddress: 'test@example.com' }
    ]
  };
  next();
});

const mockClerkMiddleware = jest.fn().mockImplementation(() => {
  return (req, res, next) => {
    req.auth = {
      userId: 'user_test123',
      sessionId: 'session_test123'
    };
    next();
  };
});

module.exports = {
  getAuth: mockGetAuth,
  requireAuth: mockRequireAuth,
  clerkMiddleware: mockClerkMiddleware
}; 