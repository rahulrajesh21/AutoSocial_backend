const sql = require('../config/database');
const axios = require('axios');

/**
 * Fetches page information from Facebook Graph API
 * @param {string} accessToken - The page access token
 * @returns {Promise<Object|null>} Page data or null if error
 */
const fetchPageInfoFromAPI = async (accessToken) => {
  try {
    const url = `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`;

    const response = await axios.get(url);
    console.log('✅ Page info fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching page info:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
};

/**
 * Checks if page ID exists in database for given access token
 * @param {string} accessToken - The page access token
 * @returns {Promise<Object|null>} Page record or null if not found
 */
const checkPageInDatabase = async (accessToken) => {
  try {
    // Hash or use a portion of token for lookup (don't store full token for security)
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(accessToken)
      .digest('hex')
      .substring(0, 16);

    const result = await sql`
      SELECT * FROM page_info 
      WHERE token_hash = ${tokenHash} 
      AND created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('❌ Database check error:', error);
    return null;
  }
};

/**
 * Stores page information in database
 * @param {Object} pageData - Page data from API
 * @param {string} accessToken - The access token used
 * @returns {Promise<Object|null>} Inserted record or null if error
 */
const storePageInDatabase = async (pageData, accessToken) => {
  try {
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(accessToken)
      .digest('hex')
      .substring(0, 16);

    const result = await sql`
      INSERT INTO page_info (
        page_id, 
        name, 
        token_hash,
        created_at,
        updated_at
      ) VALUES (
        ${pageData.id},
        ${pageData.name || null},
        ${tokenHash},
        NOW(),
        NOW()
      )
      ON CONFLICT (page_id) 
      DO UPDATE SET
        name = ${pageData.name || null},

        token_hash = ${tokenHash},
        updated_at = NOW()
      RETURNING *
    `;

    console.log('✅ Page info stored in database:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Database store error:', error);
    return null;
  }
};

/**
 * Main automation function - checks DB first, then fetches from API if needed
 * @param {string} accessToken - The page access token (from env or parameter)
 * @param {boolean} forceRefresh - Whether to force API call even if DB has data
 * @returns {Promise<Object>} Result object with page data and source info
 */
const getPageIdAutomation = async (accessToken = null, forceRefresh = false) => {
  // Use provided token or fallback to environment variable
  const token = process.env.INSTAGRAM_PAGE;
  
  if (!token) {
    return {
      success: false,
      error: 'No access token provided',
      source: 'error'
    };
  }

  try {
    let pageData = null;
    let source = 'database';

    // Step 1: Check database first (unless forcing refresh)
    if (!forceRefresh) {
      console.log('🔍 Checking database for existing page info...');
      pageData = await checkPageInDatabase(token);
      
      if (pageData) {
        console.log('✅ Found page info in database:', pageData.page_id);
        return {
          success: true,
          data: pageData,
          source: 'database',
          cached: true
        };
      }
    }

    // Step 2: If not in DB or force refresh, fetch from API
    console.log('🌐 Fetching page info from Facebook API...');
    const apiPageData = await fetchPageInfoFromAPI(token);
    
    if (!apiPageData) {
      return {
        success: false,
        error: 'Failed to fetch page info from API',
        source: 'api_error'
      };
    }

    // Step 3: Store in database for future use
    console.log('💾 Storing page info in database...');
    const storedData = await storePageInDatabase(apiPageData, token);
    
    if (!storedData) {
      // API call succeeded but DB storage failed - return API data anyway
      console.warn('⚠️ API succeeded but database storage failed');
      return {
        success: true,
        data: apiPageData,
        source: 'api_only',
        warning: 'Database storage failed'
      };
    }

    return {
      success: true,
      data: storedData,
      source: 'api_fresh',
      cached: false
    };

  } catch (error) {
    console.error('❌ Page ID automation error:', error);
    return {
      success: false,
      error: error.message,
      source: 'automation_error'
    };
  }
};

/**
 * Express route handler for page ID automation
 */
const getPageIdRoute = async (req, res) => {
  try {
    const { access_token, force_refresh } = req.query;
    const forceRefresh = force_refresh === 'true';
    
    const result = await getPageIdAutomation(access_token, forceRefresh);
    
    if (result.success) {
      return res.status(200).json({
        message: 'Page ID retrieved successfully',
        page_id: result.data.page_id || result.data.id,
        page_name: result.data.name,
        source: result.source,
        cached: result.cached || false,
        data: result.data,
        warning: result.warning || null
      });
    } else {
      return res.status(400).json({
        message: 'Failed to retrieve page ID',
        error: result.error,
        source: result.source
      });
    }
    
  } catch (error) {
    console.error('❌ Route handler error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Utility function to get just the page ID quickly
 * @param {string} accessToken - The access token
 * @returns {Promise<string|null>} Page ID or null
 */
const getPageId = async (accessToken = null) => {
  const result = await getPageIdAutomation(accessToken);
  return result.success ? (result.data.page_id || result.data.id) : null;
};

/**
 * Clean up old page info records (optional maintenance function)
 * @param {number} daysOld - Remove records older than this many days
 */
const cleanupOldPageInfo = async (daysOld = 90) => {
  try {
    const result = await sql`
      DELETE FROM page_info 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING page_id
    `;
    
    console.log(`🧹 Cleaned up ${result.length} old page info records`);
    return result.length;
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return 0;
  }
};

// Database table creation SQL (run this once to set up the table)
const createPageInfoTable = `
CREATE TABLE IF NOT EXISTS page_info (
  id SERIAL PRIMARY KEY,
  page_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  username VARCHAR(255),
  category VARCHAR(255),
  followers_count INTEGER DEFAULT 0,
  instagram_business_account VARCHAR(255),
  token_hash VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_page_id (page_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_created_at (created_at)
);
`;

// Integration example with existing Instagram utilities
const integrateWithInstagramUtils = () => {
  // Example of how to modify your existing sendMessage function
  const enhancedSendMessage = async (recipientId, messageText, accessToken = null) => {
    // Get page ID using our automation
    const pageResult = await getPageIdAutomation(accessToken);
    
    if (!pageResult.success) {
      console.error('Failed to get page info:', pageResult.error);
      return null;
    }
    
    console.log(`📧 Sending message from page: ${pageResult.data.name} (${pageResult.data.page_id})`);
    console.log(`📊 Source: ${pageResult.source}, Cached: ${pageResult.cached || false}`);
    
    // Your existing sendMessage logic here...
    const token = accessToken || process.env.INSTAGRAM_PAGE;
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/me/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: messageText },
            access_token: token
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Send Message Error:', data);
        return null;
      }

      console.log('✅ Message sent successfully:', data);
      return data;

    } catch (error) {
      console.error('Network error while sending message:', error.message);
      return null;
    }
  };

  return { enhancedSendMessage };
};

// Example webhook integration
const enhancedWebhookHandler = async (req, res) => {
  try {
    // Get page info at the start of webhook processing
    const pageResult = await getPageIdAutomation();
    
    if (!pageResult.success) {
      console.warn('⚠️ Could not retrieve page info:', pageResult.error);
    } else {
      console.log(`🎯 Processing webhook for page: ${pageResult.data.name} (${pageResult.data.page_id})`);
    }

    // Your existing webhook logic here...
    const webhookData = req.body;
    
    // Process the webhook as usual
    // ... existing logic
    
    res.status(200).json({
      message: 'Webhook processed successfully',
      page_info: pageResult.success ? {
        page_id: pageResult.data.page_id,
        page_name: pageResult.data.name,
        source: pageResult.source
      } : null
    });

  } catch (error) {
    console.error('Enhanced webhook handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getPageIdAutomation,
  getPageIdRoute,
  getPageId,
  fetchPageInfoFromAPI,
  checkPageInDatabase,
  storePageInDatabase,
  cleanupOldPageInfo,
  createPageInfoTable,
  integrateWithInstagramUtils,
  enhancedWebhookHandler
};