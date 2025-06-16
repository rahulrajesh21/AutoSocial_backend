const sql = require('../config/database');

async function createMessageLogsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS message_logs (
        id SERIAL PRIMARY KEY,
        automation_id INTEGER NOT NULL,
        action_type VARCHAR(255) NOT NULL,
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
      );
    `;
    console.log('Message logs table created successfully');
  } catch (error) {
    console.error('Error creating message_logs table:', error);
    throw error;
  }
}

// Execute the migration
createMessageLogsTable()
  .then(() => {
    console.log('Message logs migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 