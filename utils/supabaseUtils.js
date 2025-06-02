const supabase = require('../config/database');

/**
 * Example function to fetch data from a table
 * @param {string} tableName - The name of the table to query
 * @param {Object} options - Query options (columns, filters, etc.)
 * @returns {Promise} - The query result
 */
async function fetchData(tableName, options = {}) {
  const { columns = '*', filters = {} } = options;
  
  let query = supabase.from(tableName).select(columns);
  
  // Apply filters if any
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
  
  return data;
}

/**
 * Example function to insert data into a table
 * @param {string} tableName - The name of the table
 * @param {Object} data - The data to insert
 * @returns {Promise} - The insert result
 */
async function insertData(tableName, data) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();
  
  if (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
  
  return result;
}

module.exports = {
  fetchData,
  insertData
}; 