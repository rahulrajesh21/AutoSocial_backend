const { clerkMiddleware, requireAuth, clerkClient } = require('@clerk/express');

// Export the middleware functions
module.exports = {
  clerkMiddleware: clerkMiddleware(),
  requireAuth: requireAuth(),
  clerkClient
};