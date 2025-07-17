import postgres from 'postgres';

async function fixMissingColumns() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Adding missing columns...');

    // Add missing columns to properties table
    await sql`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS estimated_arv INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS under_contract_status TEXT DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS contract_upload_url TEXT,
      ADD COLUMN IF NOT EXISTS mls_status TEXT,
      ADD COLUMN IF NOT EXISTS deal_type TEXT,
      ADD COLUMN IF NOT EXISTS contract_holder_name TEXT,
      ADD COLUMN IF NOT EXISTS contract_holder_phone TEXT,
      ADD COLUMN IF NOT EXISTS contract_holder_email TEXT,
      ADD COLUMN IF NOT EXISTS asking_price INTEGER,
      ADD COLUMN IF NOT EXISTS contract_price INTEGER,
      ADD COLUMN IF NOT EXISTS repairs_needed TEXT,
      ADD COLUMN IF NOT EXISTS contract_expiration TIMESTAMP,
      ADD COLUMN IF NOT EXISTS exit_strategy TEXT,
      ADD COLUMN IF NOT EXISTS occupancy_status TEXT,
      ADD COLUMN IF NOT EXISTS showing_instructions TEXT,
      ADD COLUMN IF NOT EXISTS distress_type TEXT,
      ADD COLUMN IF NOT EXISTS lead_source TEXT,
      ADD COLUMN IF NOT EXISTS time_found TIMESTAMP;
    `;

    // Add missing columns to investors table
    await sql`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS company TEXT,
      ADD COLUMN IF NOT EXISTS max_budget INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS min_budget INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS property_types TEXT[] DEFAULT ARRAY['Single Family'],
      ADD COLUMN IF NOT EXISTS deals_completed INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;
    `;

    // Add missing columns to leads table
    await sql`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS last_contact_date DATE,
      ADD COLUMN IF NOT EXISTS company TEXT;
    `;

    // Add missing columns to contacts table
    await sql`
      ALTER TABLE contacts 
      ADD COLUMN IF NOT EXISTS company TEXT;
    `;

    // Update existing investors to have proper default values
    await sql`
      UPDATE investors SET 
        max_budget = COALESCE(max_budget, 0),
        min_budget = COALESCE(min_budget, 0),
        status = COALESCE(status, 'active'),
        property_types = COALESCE(property_types, ARRAY['Single Family']),
        deals_completed = COALESCE(deals_completed, 0)
      WHERE max_budget IS NULL OR min_budget IS NULL OR status IS NULL;
    `;

    // Add missing columns to investors table if they don't exist
    await sql`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS preferred_islands TEXT[] DEFAULT ARRAY['Oahu'],
      ADD COLUMN IF NOT EXISTS strategies TEXT[] DEFAULT ARRAY['Buy & Hold']
    `;
    console.log('✓ Added missing array columns to investors table');

    // Update existing investors to have default values for array columns
    await sql`
      UPDATE investors SET 
        preferred_islands = COALESCE(preferred_islands, ARRAY['Oahu']),
        strategies = COALESCE(strategies, ARRAY['Buy & Hold'])
      WHERE preferred_islands IS NULL OR strategies IS NULL
    `;
    console.log('✓ Updated existing investors with default array values');

    console.log('Successfully added all missing columns');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await sql.end();
  }
}

fixMissingColumns();