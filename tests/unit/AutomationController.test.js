const { createAutomation } = require('../../controllers/AutomationController');

// Mock dependencies
jest.mock('../../config/database', () => require('../mocks/database.mock'));
jest.mock('@clerk/express', () => ({
  getAuth: require('../mocks/clerk.mock').getAuth
}));

describe('AutomationController', () => {
  // Setup
  let req, res;
  
  beforeEach(() => {
    // Reset console spies
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock request object
    req = {
      body: {
        id: 1,
        flowData: {
          nodes: [
            {
              id: 'node1',
              type: 'instgram',
              data: {
                selectedOption: 'get-comments',
                selectedPost: {
                  username: 'testuser',
                  mediaId: 'media123'
                }
              }
            },
            {
              id: 'node2',
              type: 'instgram',
              data: {
                selectedOption: 'send-message',
                message: 'Thank you for your comment!'
              }
            },
            {
              id: 'node3',
              type: 'gemini',
              data: {
                prompt: 'Generate a response'
              }
            },
            {
              id: 'node4',
              type: 'helpDesk',
              data: {
                category: 'support'
              }
            }
          ],
          edges: [
            {
              id: 'edge1',
              source: 'node1',
              target: 'node3',
              animated: true
            },
            {
              id: 'edge2',
              source: 'node3',
              target: 'node2',
              animated: false
            }
          ]
        }
      }
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock SQL implementation for automation
    const mockSql = require('../mocks/database.mock');
    
    // Mock for UPDATE automations
    mockSql.mockImplementationOnce((strings, ...values) => {
      if (strings.join('?').includes('UPDATE automations')) {
        return Promise.resolve([
          {
            id: 1,
            name: 'Test Automation',
            description: 'Test Description',
            user_id: 'user_test123',
            automation_template: req.body.flowData
          }
        ]);
      }
      return Promise.resolve([]);
    });
    
    // Mock for INSERT INTO automation_metadata
    mockSql.mockImplementationOnce(() => {
      return Promise.resolve([{ id: 1 }]);
    });
    
    // Mock for INSERT INTO comment_automation
    mockSql.mockImplementationOnce(() => {
      return Promise.resolve([
        {
          id: 1,
          automation_id: 1,
          username: 'testuser',
          media_id: 'media123'
        }
      ]);
    });
    
    // Mock for INSERT INTO action_automation (helpDesk)
    mockSql.mockImplementationOnce(() => {
      return Promise.resolve([
        {
          id: 2,
          automation_id: 1,
          action_type: 'helpDesk',
          action_data: { category: 'support' }
        }
      ]);
    });
  });
  
  describe('createAutomation', () => {
    it('should create an automation successfully', async () => {
      // Act
      await createAutomation(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Automation created successfully',
          data: expect.objectContaining({
            id: 1,
            name: 'Test Automation'
          }),
          flowAnalysis: expect.objectContaining({
            triggers: expect.arrayContaining([
              expect.objectContaining({
                type: 'get-comments'
              })
            ]),
            actions: expect.arrayContaining([
              expect.objectContaining({
                type: 'send-message'
              })
            ]),
            processors: expect.arrayContaining([
              expect.objectContaining({
                type: 'gemini'
              }),
              expect.objectContaining({
                type: 'helpDesk'
              })
            ]),
            connections: expect.arrayContaining([
              expect.objectContaining({
                from: 'node1',
                to: 'node3'
              }),
              expect.objectContaining({
                from: 'node3',
                to: 'node2'
              })
            ])
          }),
          processingResults: expect.arrayContaining([
            expect.objectContaining({
              type: 'get-comments'
            }),
            expect.objectContaining({
              type: 'helpDesk'
            })
          ])
        })
      );
    });
    
    it('should return 404 if automation not found', async () => {
      // Arrange
      const mockSql = require('../mocks/database.mock');
      
      // Override the first mock to return empty array (no automation found)
      mockSql.mockReset();
      mockSql.mockImplementationOnce(() => Promise.resolve([]));
      
      // Act
      await createAutomation(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Automation not found or not owned by user'
      });
    });
    
    it('should handle errors properly', async () => {
      // Arrange
      const mockSql = require('../mocks/database.mock');
      
      // Override the first mock to throw an error
      mockSql.mockReset();
      mockSql.mockImplementationOnce(() => Promise.reject(new Error('Database error')));
      
      // Act
      await createAutomation(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 