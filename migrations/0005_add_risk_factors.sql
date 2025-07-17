-- Add risk factor fields to leads table
ALTER TABLE leads
ADD COLUMN zoning_change_potential BOOLEAN DEFAULT false,
ADD COLUMN development_zone_risk TEXT DEFAULT 'None',
ADD COLUMN natural_disaster_risk TEXT DEFAULT 'Unknown',
ADD COLUMN wildfire_risk_level TEXT DEFAULT 'Unknown',
ADD COLUMN flood_zone TEXT DEFAULT 'None',
ADD COLUMN lava_zone INTEGER DEFAULT NULL,
ADD COLUMN tsunami_evacuation_zone BOOLEAN DEFAULT false,
ADD COLUMN risk_score INTEGER DEFAULT 50,
ADD COLUMN risk_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN last_risk_assessment TIMESTAMP DEFAULT NULL;

-- Add indexes for risk-related queries
CREATE INDEX idx_leads_natural_disaster_risk ON leads(natural_disaster_risk);
CREATE INDEX idx_leads_development_zone_risk ON leads(development_zone_risk);
CREATE INDEX idx_leads_risk_score ON leads(risk_score);
CREATE INDEX idx_leads_zoning_change_potential ON leads(zoning_change_potential);

-- Add risk assessment history table
CREATE TABLE risk_assessments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL,
  risk_level TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT NULL,
  factors JSONB DEFAULT '{}',
  data_sources TEXT[],
  assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_assessments_lead_id ON risk_assessments(lead_id);
CREATE INDEX idx_risk_assessments_type ON risk_assessments(assessment_type);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);

-- Add risk factor columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS zoning_change_potential BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS development_zone_risk TEXT DEFAULT 'None',
ADD COLUMN IF NOT EXISTS natural_disaster_risk TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS wildfire_risk_zone TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS flood_zone TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS lava_zone TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS tsunami_risk TEXT DEFAULT 'Unknown';

-- Add missing columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_contact_date DATE,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add missing columns to contacts table if they don't exist
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add missing columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS estimated_arv INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS under_contract_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS contract_upload_url TEXT;

-- Add missing columns to investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS max_budget INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_budget INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS property_types TEXT[] DEFAULT ARRAY['Single Family'],
ADD COLUMN IF NOT EXISTS deals_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Update existing investors to have proper default values
UPDATE investors SET 
  max_budget = COALESCE(max_budget, 0),
  min_budget = COALESCE(min_budget, 0),
  status = COALESCE(status, 'active'),
  property_types = COALESCE(property_types, ARRAY['Single Family']),
  deals_completed = COALESCE(deals_completed, 0)
WHERE max_budget IS NULL OR min_budget IS NULL OR status IS NULL;

-- Add risk factors to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS city_development_risk JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS environmental_risk JSONB DEFAULT '{}';