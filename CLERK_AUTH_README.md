# Clerk Authentication Integration

This document explains how to set up and use Clerk authentication in your Express application using the `@clerk/express` package.

## Setup

1. Create a Clerk account at [clerk.dev](https://clerk.dev)
2. Create a new application in the Clerk dashboard
3. Get your API keys from the Clerk dashboard

## Environment Variables

Add the following variables to your `.env` file:

```
CLERK_PUBLISHABLE_KEY=pk_*******
CLERK_SECRET_KEY=sk_*******
```

## Usage

### Middleware Configuration

The application is already configured with Clerk middleware:

```javascript
// In server.js
const { clerkAuth } = require('./middlewares/clerkAuth');

// Apply Clerk authentication middleware globally
app.use(clerkAuth);
```

### Protecting Routes

To protect a route, use the `requireAuth` middleware:

```javascript
const { requireAuth } = require('../middlewares/clerkAuth');

// Protected route
router.post('/example', requireAuth, (req, res) => {
  // Only authenticated users can access this route
});
```

### Getting User Information

To get detailed user information, use the `addUserDetails` middleware after `requireAuth`:

```javascript
const { requireAuth } = require('../middlewares/clerkAuth');
const addUserDetails = require('../middlewares/Auth');

// Protected route with user details
router.post('/example', requireAuth, addUserDetails, (req, res) => {
  // req.user contains user information
  const { id, username } = req.user;
});
```

### Custom Authorization Logic

You can create custom authorization logic using the `getAuth` helper:

```javascript
const { getAuth } = require('@clerk/express');

const hasPermission = (req, res, next) => {
  const auth = getAuth(req);
  
  // Check for permissions
  if (!auth.has({ permission: 'org:admin:something' })) {
    return res.status(403).json({ error: 'Unauthorized: Insufficient permissions' });
  }
  
  next();
};

router.post('/admin', requireAuth, hasPermission, adminController);
```

### Using Clerk API Client

You can use the Clerk API client to access Clerk's backend API:

```javascript
const { clerkClient } = require('../middlewares/clerkAuth');

// Example: Get all users
const users = await clerkClient.users.getUserList();
```

### Frontend Integration

In your frontend application, you need to:

1. Install the Clerk React SDK
2. Set up the Clerk provider
3. Send the session token with API requests

```javascript
// Example of sending authenticated request
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${await Clerk.session.getToken()}`,
  }
});
``` 