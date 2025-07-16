
import postgres from 'postgres';

async function runMigration() {
  const pool = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Running migration...');
    
    // Add the missing columns
    await pool`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS under_contract_status TEXT,
      ADD COLUMN IF NOT EXISTS contract_upload_url TEXT;
    `;
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
