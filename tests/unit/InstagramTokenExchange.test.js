const { exchangeToken } = require('../../controllers/InstagramController');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Instagram Token Exchange', () => {
  // Setup
  let req, res;
  
  beforeEach(() => {
    // Reset console spies
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock environment variables
    process.env.FACEBOOK_APP_ID = 'mock_app_id';
    process.env.FACEBOOK_APP_SECRET = 'mock_app_secret';
    
    // Mock request object
    req = {
      body: {
        shortLivedToken: 'short_lived_token_123'
      }
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  afterEach(() => {
    // Clean up environment variables
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;
  });
  
  it('should exchange a short-lived token for a long-lived token', async () => {
    // Mock successful API response
    axios.get.mockResolvedValue({
      data: {
        access_token: 'long_lived_token_456',
        expires_in: 5184000 // 60 days
      }
    });
    
    // Act
    await exchangeToken(req, res);
    
    // Assert
    expect(axios.get).toHaveBeenCalledWith('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: 'mock_app_id',
        client_secret: 'mock_app_secret',
        fb_exchange_token: 'short_lived_token_123'
      }
    });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      access_token: 'long_lived_token_456',
      expires_in: 5184000
    });
  });
  
  it('should return 400 if short-lived token is missing', async () => {
    // Arrange
    req.body = {}; // Missing shortLivedToken
    
    // Act
    await exchangeToken(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Short-lived token is required'
    });
  });
  
  it('should return 400 if token exchange fails', async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: {} // Missing access_token
    });
    
    // Act
    await exchangeToken(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to exchange token'
    });
  });
  
  it('should return 500 if API call throws an error', async () => {
    // Arrange
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Invalid OAuth access token',
            type: 'OAuthException',
            code: 190
          }
        }
      }
    };
    axios.get.mockRejectedValue(errorResponse);
    
    // Act
    await exchangeToken(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to exchange token',
      details: errorResponse.response.data
    });
  });
}); 