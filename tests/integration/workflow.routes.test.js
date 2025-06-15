const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../config/database', () => require('../mocks/database.mock'));
jest.mock('@clerk/express', () => ({
  getAuth: require('../mocks/clerk.mock').getAuth,
  requireAuth: require('../mocks/clerk.mock').requireAuth,
  clerkMiddleware: require('../mocks/clerk.mock').clerkMiddleware
}));

// Import the router after mocking dependencies
const workflowRouter = require('../../routes/workflow');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', workflowRouter);

describe('Workflow Routes', () => {
  describe('POST /api/Createworkflow', () => {
    it('should create a new workflow', async () => {
      const response = await request(app)
        .post('/api/Createworkflow')
        .send({
          name: 'Test Workflow',
          description: 'This is a test workflow'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Workflow created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Test Workflow');
      expect(response.body.data).toHaveProperty('description', 'This is a test workflow');
    });
    
    it('should return 400 if name or description is missing', async () => {
      const response = await request(app)
        .post('/api/Createworkflow')
        .send({
          name: 'Test Workflow'
          // Missing description
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and description are required');
    });
  });
  
  describe('GET /api/GetAllWorkflows', () => {
    it('should return all workflows for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/GetAllWorkflows');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Workflows retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/GetWorkflowById/:id', () => {
    it('should return a specific workflow by ID', async () => {
      const response = await request(app)
        .get('/api/GetWorkflowById/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Workflow retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('description');
    });
  });
  
  describe('POST /api/UpdateAutomationStatus', () => {
    it('should update the status of an automation', async () => {
      const response = await request(app)
        .post('/api/UpdateAutomationStatus')
        .send({
          id: 1,
          status: true
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Automation status updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('status', true);
    });
    
    it('should return 400 if id or status is missing', async () => {
      const response = await request(app)
        .post('/api/UpdateAutomationStatus')
        .send({
          id: 1
          // Missing status
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Automation ID and status are required');
    });
  });
}); 