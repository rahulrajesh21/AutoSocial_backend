const { getAllItems, createItem } = require('../../controllers/exampleController');

// Mock the supabaseUtils module
jest.mock('../../utils/supabaseUtils', () => ({
  fetchData: jest.fn(),
  insertData: jest.fn()
}));

// Import the mocked module
const { fetchData, insertData } = require('../../utils/supabaseUtils');

describe('Example Controller', () => {
  // Setup
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    fetchData.mockReset();
    insertData.mockReset();
    
    // Mock request object
    req = {
      params: {},
      body: {}
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('getAllItems', () => {
    it('should fetch data from the specified table', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test Item' }];
      fetchData.mockResolvedValue(mockData);
      req.params.table = 'test_table';
      
      // Act
      await getAllItems(req, res);
      
      // Assert
      expect(fetchData).toHaveBeenCalledWith('test_table');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData
      });
    });
    
    it('should use default_table if no table is specified', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test Item' }];
      fetchData.mockResolvedValue(mockData);
      
      // Act
      await getAllItems(req, res);
      
      // Assert
      expect(fetchData).toHaveBeenCalledWith('default_table');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData
      });
    });
    
    it('should handle errors properly', async () => {
      // Arrange
      const error = new Error('Database error');
      fetchData.mockRejectedValue(error);
      
      // Act
      await getAllItems(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });
  
  describe('createItem', () => {
    it('should create an item in the specified table', async () => {
      // Arrange
      const mockItem = { name: 'New Item', value: 123 };
      const mockResult = { id: 1, ...mockItem };
      insertData.mockResolvedValue(mockResult);
      req.params.table = 'test_table';
      req.body = mockItem;
      
      // Act
      await createItem(req, res);
      
      // Assert
      expect(insertData).toHaveBeenCalledWith('test_table', mockItem);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
    
    it('should return 400 if no data is provided', async () => {
      // Arrange
      req.body = {};
      
      // Act
      await createItem(req, res);
      
      // Assert
      expect(insertData).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No data provided'
      });
    });
    
    it('should handle errors properly', async () => {
      // Arrange
      const error = new Error('Database error');
      insertData.mockRejectedValue(error);
      req.body = { name: 'Test Item' };
      
      // Act
      await createItem(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });
}); 