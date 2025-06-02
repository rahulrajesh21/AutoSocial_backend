const { clerkClient, getAuth } = require('@clerk/express');

const addUserDetails = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(auth.userId);
    const username = user.username || user.firstName || 'Unknown'; // Fallback to firstName or default

    // Attach user data to req.user for consistency with controllers
    req.user = {
      id: auth.userId,
      username,
    };

    next();
  } catch (err) {
    console.error('Error in addUserDetails middleware:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = addUserDetails;