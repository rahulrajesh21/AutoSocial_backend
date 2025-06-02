// middleware/addUserDetails.js
const { clerkClient } = require('@clerk/clerk-sdk-node');

const addUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.auth; // Populated by ClerkExpressWithAuth

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const username = user.username || user.firstName || 'Unknown'; // Fallback to firstName or default

    // Attach user data to req.user for consistency with controllers
    req.user = {
      id: userId,
      username,
    };

    next();
  } catch (err) {
    console.error('Error in addUserDetails middleware:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = addUserDetails;