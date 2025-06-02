const { fetchData, insertData } = require('../utils/supabaseUtils');

/**
 * Get all items from a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllItems(req, res) {
  try {
    const tableName = req.params.table || 'default_table';
    const data = await fetchData(tableName);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Create a new item in a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createItem(req, res) {
  try {
    const tableName = req.params.table || 'default_table';
    const itemData = req.body;
    
    if (!itemData || Object.keys(itemData).length === 0) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }
    
    const result = await insertData(tableName, itemData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllItems,
  createItem
}; 