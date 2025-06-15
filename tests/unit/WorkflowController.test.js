const { 
  CreateWorkflowController, 
  GetAllWorkflows, 
  UpdateAutomationStatus, 
  GetWorkflowById 
} = require('../../controllers/WorkflowController');

// Mock dependencies
jest.mock('../../config/database', () => require('../mocks/database.mock'));
jest.mock('@clerk/express', () => ({
  getAuth: require('../mocks/clerk.mock').getAuth
}));

describe('WorkflowController', () => {
  // Setup
  let req, res;
  
  beforeEach(() => {
    // Mock request object
    req = {
      body: {},
      params: {},
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
  
  describe('CreateWorkflowController', () => {
    it('should create a workflow successfully', async () => {
      // Arrange
      req.body = {
        name: 'Test Workflow',
        description: 'This is a test workflow'
      };
      
      // Act
      await CreateWorkflowController(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Workflow created successfully',
          data: expect.objectContaining({
            id: expect.any(Number),
            name: 'Test Workflow',
            description: 'This is a test workflow'
          })
        })
      );
    });
    
    it('should return 400 if name or description is missing', async () => {
      // Arrange
      req.body = { name: 'Test Workflow' }; // Missing description
      
      // Act
      await CreateWorkflowController(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Name and description are required'
        })
      );
    });
  });
  
  describe('GetAllWorkflows', () => {
    it('should return all workflows for a user', async () => {
      // Act
      await GetAllWorkflows(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Workflows retrieved successfully',
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              description: expect.any(String)
            })
          ])
        })
      );
    });
  });
  
  describe('GetWorkflowById', () => {
    it('should return a specific workflow by ID', async () => {
      // Arrange
      req.params = { id: 1 };
      
      // Act
      await GetWorkflowById(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Workflow retrieved successfully',
          data: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String)
          })
        })
      );
    });
  });
  
  describe('UpdateAutomationStatus', () => {
    it('should update the status of an automation', async () => {
      // Arrange
      req.body = { id: 1, status: true };
      
      // Act
      await UpdateAutomationStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Automation status updated successfully',
          data: expect.objectContaining({
            id: 1,
            status: true
          })
        })
      );
    });
    
    it('should return 400 if id or status is missing', async () => {
      // Arrange
      req.body = { id: 1 }; // Missing status
      
      // Act
      await UpdateAutomationStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Automation ID and status are required'
        })
      );
    });
  });
}); 