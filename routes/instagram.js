const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/clerkAuth');
const addUserDetails = require('../middlewares/Auth');
const sql = require('../config/database');

/**
 * Save Instagram access token
 * POST /api/instagram/save-token
 */
router.post('/save-token', requireAuth, addUserDetails, async (req, res) => {
  try {
    const { instagramUserId, accessToken, expiresIn } = req.body;
    const userId = req.user.id;

    if (!instagramUserId || !accessToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + (expiresIn || 5184000)); // Default to 60 days if not provided

    // Check if an integration already exists for this user
    const existingIntegration = await sql`
      SELECT id FROM integrations 
      WHERE user_id = ${userId} AND provider = 'instagram'
    `;

    if (existingIntegration.length > 0) {
      // Update existing integration
      await sql`
        UPDATE integrations 
        SET 
          access_token = ${accessToken},
          provider_user_id = ${instagramUserId},
          expires_at = ${expiryDate},
          updated_at = NOW()
        WHERE id = ${existingIntegration[0].id}
      `;
    } else {
      // Create new integration
      await sql`
        INSERT INTO integrations (
          user_id, 
          provider, 
          provider_user_id, 
          access_token, 
          expires_at, 
          created_at, 
          updated_at
        ) VALUES (
          ${userId}, 
          'instagram', 
          ${instagramUserId}, 
          ${accessToken}, 
          ${expiryDate}, 
          NOW(), 
          NOW()
        )
      `;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving Instagram token:', error);
    res.status(500).json({ error: 'Failed to save Instagram token' });
  }
});

/**
 * Check if user has a valid Instagram integration
 * GET /api/instagram/status
 */
router.get('/status', requireAuth, addUserDetails, async (req, res) => {
  try {
    const userId = req.user.id;

    const integration = await sql`
      SELECT expires_at 
      FROM integrations 
      WHERE user_id = ${userId} 
        AND provider = 'instagram' 
        AND expires_at > NOW()
    `;

    res.status(200).json({
      connected: integration.length > 0,
      expiresAt: integration.length > 0 ? integration[0].expires_at : null,
    });
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    res.status(500).json({ error: 'Failed to check Instagram status' });
  }
});

module.exports = router; 