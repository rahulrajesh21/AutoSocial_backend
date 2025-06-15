// Mock for the database module
const mockSql = jest.fn();

// Mock implementation for SQL queries
mockSql.mockImplementation((strings, ...values) => {
  // Extract the SQL query from the template literal
  const query = strings.join('?');
  
  // Handle different queries based on the content
  if (query.includes('SELECT * FROM users WHERE id =')) {
    return Promise.resolve([{ id: values[0], name: 'Test User' }]);
  }
  
  if (query.includes('insert into users')) {
    return Promise.resolve([{ id: values[0] }]);
  }
  
  if (query.includes('INSERT INTO automations')) {
    return Promise.resolve([
      { 
        id: 1, 
        name: values[0], 
        description: values[1], 
        user_id: values[2],
        created_at: new Date(),
        status: false
      }
    ]);
  }
  
  if (query.includes('SELECT automations.*')) {
    return Promise.resolve([
      { 
        id: 1, 
        name: 'Test Workflow', 
        description: 'Test Description', 
        user_id: values[0],
        created_at: new Date(),
        status: false
      }
    ]);
  }
  
  if (query.includes('UPDATE automations')) {
    return Promise.resolve([
      { 
        id: values[1], 
        status: values[0]
      }
    ]);
  }
  
  if (query.includes('SELECT expires_at FROM integrations')) {
    return Promise.resolve([
      { 
        expires_at: new Date(Date.now() + 86400000) // expires tomorrow
      }
    ]);
  }
  
  // Default response for unhandled queries
  return Promise.resolve([]);
});

module.exports = mockSql; 