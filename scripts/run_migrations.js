const fs = require('fs');
const path = require('path');
const sql = require('../config/database');

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    
    // Get list of executed migrations
    const executedMigrations = await sql`SELECT name FROM migrations`;
    const executedMigrationNames = executedMigrations.map(m => m.name);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure consistent order
    
    // Execute migrations that haven't been run yet
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        // Read migration file
        const migrationPath = path.join(migrationsDir, file);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        await sql.unsafe(migrationSql);
        
        // Record migration
        await sql`INSERT INTO migrations (name) VALUES (${file})`;
        
        console.log(`Migration ${file} completed successfully`);
      } else {
        console.log(`Migration ${file} already executed, skipping`);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 