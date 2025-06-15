const { getWebhook } = require('../../controllers/InstagramController');

// Mock dependencies
jest.mock('../../config/database', () => require('../mocks/database.mock'));
jest.mock('@clerk/express', () => ({
  getAuth: jest.fn().mockImplementation(() => {
    throw new Error('Auth not available');
  })
}));

// Mock Instagram utilities
jest.mock('../../utils/instagramUtils', () => ({
  replyToComment: jest.fn(),
  sendMessage: jest.fn(),
  sendMedia: jest.fn()
}));

// Mock Gemini utilities
jest.mock('../../utils/geminiUtils', () => ({
  gemini: jest.fn().mockResolvedValue('AI response')
}));

describe('InstagramController', () => {
  // Setup
  let req, res;
  let consoleLogSpy;
  
  beforeEach(() => {
    // Reset console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('getWebhook', () => {
    it('should handle invalid webhook format', async () => {
      // Arrange
      req = {
        body: { 
          // Missing entry array
        }
      };
      
      // Act
      await getWebhook(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid webhook format'
        })
      );
    });
    
    it('should handle comment webhooks with missing data', async () => {
      // Arrange
      req = {
        body: {
          entry: [{
            id: '123456789',
            time: 1234567890,
            changes: [{
              field: 'comments',
              value: {
                // Missing 'from' object which contains username
                media: {
                  id: 'media123'
                },
                id: 'comment123',
                text: 'Test comment'
              }
            }]
          }]
        }
      };
      
      // Mock SQL implementation
      const mockSql = require('../mocks/database.mock');
      
      // Mock for SELECT automations query
      mockSql.mockImplementationOnce(() => {
        return Promise.resolve([
          {
            id: 42,
            automation_template: {
              nodes: [
                {
                  id: 'node1',
                  type: 'instgram',
                  data: {
                    selectedOption: 'get-comments'
                  }
                }
              ],
              edges: []
            },
            user_id: 'user123',
            media_id: 'media123'
          }
        ]);
      });
      
      // Mock for comment_automation query
      mockSql.mockImplementationOnce(() => {
        return Promise.resolve([
          {
            automation_id: 42,
            media_id: 'media123',
            username: 'test_user'
          }
        ]);
      });
      
      // Act
      await getWebhook(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      
      // We're now focusing on the response rather than the log
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Webhook processed successfully')
        })
      );
      
      // Check that the response includes results
      const jsonCallArgs = res.json.mock.calls[0][0];
      expect(jsonCallArgs).toHaveProperty('results');
      expect(Array.isArray(jsonCallArgs.results)).toBe(true);
      
      // Check that at least one result has success: false
      const hasFailedResult = jsonCallArgs.results.some(
        result => result.automationId === 42 && result.result && result.result.success === false
      );
      expect(hasFailedResult).toBe(true);
    });
    
    it('should handle message webhooks with valid data', async () => {
      // Arrange
      req = {
        body: {
          entry: [{
            id: '123456789',
            time: 1234567890,
            messaging: [{
              sender: {
                id: 'sender123'
              },
              recipient: {
                id: 'recipient123'
              },
              message: {
                text: 'Hello',
                mid: 'message123'
              },
              timestamp: 1234567890
            }]
          }]
        }
      };
      
      // Mock SQL implementation
      const mockSql = require('../mocks/database.mock');
      
      // Mock for SELECT automations query
      mockSql.mockImplementationOnce(() => {
        return Promise.resolve([
          {
            id: 43,
            automation_template: {
              nodes: [
                {
                  id: 'node1',
                  type: 'instgram',
                  data: {
                    selectedOption: 'receive-message'
                  }
                }
              ],
              edges: []
            },
            user_id: 'user123'
          }
        ]);
      });
      
      // Mock for message_automation query
      mockSql.mockImplementationOnce(() => {
        return Promise.resolve([
          {
            automation_id: 43,
            trigger_type: 'receive-message',
            username: 'test_user'
          }
        ]);
      });
      
      // Act
      await getWebhook(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Webhook processed successfully'),
          webhookType: 'message'
        })
      );
    });
  });
}); 