require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('../config/database');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Path to migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    
    // Read all SQL files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the SQL statements
      await sql.unsafe(migrationSql);
      
      console.log(`Migration completed: ${file}`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 