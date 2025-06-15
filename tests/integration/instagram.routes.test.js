const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../config/database', () => require('../mocks/database.mock'));
jest.mock('@clerk/express', () => ({
  getAuth: require('../mocks/clerk.mock').getAuth,
  requireAuth: require('../mocks/clerk.mock').requireAuth
}));

// Mock the middleware
jest.mock('../../middlewares/clerkAuth', () => ({
  requireAuth: require('../mocks/clerk.mock').requireAuth
}));

jest.mock('../../middlewares/Auth', () => {
  return jest.fn((req, res, next) => {
    req.user = {
      id: 'user_test123',
      username: 'testuser'
    };
    next();
  });
});

// Mock controllers
jest.mock('../../controllers/InstagramController', () => ({
  getWebhook: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateInstagramSettings: jest.fn((req, res) => res.status(200).json({ success: true })),
  getInstagramSettings: jest.fn((req, res) => res.status(200).json({
    settings: {
      autoReply: true,
      replyMessage: 'Thanks for your message!'
    }
  }))
}));

// Import the router after mocking dependencies
const instagramRouter = require('../../routes/instagram');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/instagram', instagramRouter);

describe('Instagram Routes', () => {
  describe('POST /api/instagram/save-token', () => {
    it('should save an Instagram access token', async () => {
      const response = await request(app)
        .post('/api/instagram/save-token')
        .send({
          instagramUserId: '12345',
          accessToken: 'test_token',
          expiresIn: 5184000 // 60 days
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/instagram/save-token')
        .send({
          instagramUserId: '12345'
          // Missing accessToken
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });
  
  describe('GET /api/instagram/status', () => {
    it('should return the Instagram connection status', async () => {
      // Override the mock database response for this test
      const mockSql = require('../mocks/database.mock');
      mockSql.mockImplementationOnce(() => {
        return Promise.resolve([{ expires_at: new Date(Date.now() + 86400000) }]);
      });
      
      const response = await request(app)
        .get('/api/instagram/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('connected');
      // Now we expect connected to be true based on our mock
      expect(response.body.connected).toBe(true);
      expect(response.body).toHaveProperty('expiresAt');
    });
  });
  
  describe('POST /api/instagram/webhook', () => {
    it('should handle Instagram webhook events', async () => {
      const response = await request(app)
        .post('/api/instagram/webhook')
        .send({
          object: 'instagram',
          entry: [
            {
              id: '123456789',
              time: 1234567890,
              changes: [
                {
                  field: 'mentions',
                  value: {
                    comment_id: '17895695642040440',
                    media_id: '17955756066141184'
                  }
                }
              ]
            }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
  
  describe('GET /api/instagram/settings', () => {
    it('should return Instagram settings for the user', async () => {
      const response = await request(app)
        .get('/api/instagram/settings');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toHaveProperty('autoReply');
      expect(response.body.settings).toHaveProperty('replyMessage');
    });
  });
  
  describe('POST /api/instagram/settings', () => {
    it('should update Instagram settings for the user', async () => {
      const response = await request(app)
        .post('/api/instagram/settings')
        .send({
          autoReply: true,
          replyMessage: 'Thanks for your message!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
}); 