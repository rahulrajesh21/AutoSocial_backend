const sql = require('../config/database');

async function createInstagramSettingsTable() {
  try {
    console.log('Creating instagram_settings table...');
    
    // Create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS instagram_settings (
        id VARCHAR(255) PRIMARY KEY,
        access_token TEXT,
        page_access_token TEXT
      )
    `;
    
    console.log('instagram_settings table created successfully');
  } catch (error) {
    console.error('Error creating instagram_settings table:', error);
    throw error;
  }
}

// Execute if this file is run directly
if (require.main === module) {
  createInstagramSettingsTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = createInstagramSettingsTable; 