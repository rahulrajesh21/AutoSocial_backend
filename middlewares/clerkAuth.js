const { clerkMiddleware, requireAuth, clerkClient } = require('@clerk/express');
require('dotenv').config();

// Export the middleware functions directly
module.exports = {
  clerkAuth: clerkMiddleware(),
  requireAuth: requireAuth(),
  clerkClient
}; 