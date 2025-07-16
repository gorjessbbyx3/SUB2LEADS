
-- Add new fields to properties table
ALTER TABLE properties ADD COLUMN under_contract_status TEXT DEFAULT 'no';
ALTER TABLE properties ADD COLUMN contract_upload_url TEXT;
ALTER TABLE properties ADD COLUMN mls_status TEXT;
ALTER TABLE properties ADD COLUMN deal_type TEXT;
ALTER TABLE properties ADD COLUMN contract_holder_name TEXT;
ALTER TABLE properties ADD COLUMN contract_holder_phone TEXT;
ALTER TABLE properties ADD COLUMN contract_holder_email TEXT;
ALTER TABLE properties ADD COLUMN asking_price INTEGER;
ALTER TABLE properties ADD COLUMN contract_price INTEGER;
ALTER TABLE properties ADD COLUMN estimated_arv INTEGER;
ALTER TABLE properties ADD COLUMN repairs_needed TEXT;
ALTER TABLE properties ADD COLUMN contract_expiration TIMESTAMP;
ALTER TABLE properties ADD COLUMN exit_strategy TEXT;
ALTER TABLE properties ADD COLUMN occupancy_status TEXT;
ALTER TABLE properties ADD COLUMN showing_instructions TEXT;
ALTER TABLE properties ADD COLUMN distress_type TEXT;
ALTER TABLE properties ADD COLUMN lead_source TEXT;
ALTER TABLE properties ADD COLUMN time_found TIMESTAMP;
