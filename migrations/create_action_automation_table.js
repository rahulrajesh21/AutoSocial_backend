const sql = require('../config/database');

async function createActionAutomationTable() {
  try {
    console.log('Creating action_automation table...');
    
    // Create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS action_automation (
        id SERIAL PRIMARY KEY,
        automation_id TEXT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        trigger_conditions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create indexes for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_action_automation_automation_id ON action_automation(automation_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_action_automation_action_type ON action_automation(action_type)
    `;
    
    console.log('action_automation table created successfully');
  } catch (error) {
    console.error('Error creating action_automation table:', error);
    throw error;
  }
}

// Execute if this file is run directly
if (require.main === module) {
  createActionAutomationTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = createActionAutomationTable; 