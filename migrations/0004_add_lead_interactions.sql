
-- Create lead_interactions table for tracking all communications
CREATE TABLE lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'call', 'meeting', 'letter')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT,
  sentiment_score DECIMAL(3,2) DEFAULT NULL,
  response_received BOOLEAN DEFAULT FALSE,
  response_time_hours INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table for Inngest job tracking
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  task_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT DEFAULT NULL,
  payload JSONB DEFAULT NULL,
  result JSONB DEFAULT NULL,
  started_at TIMESTAMP DEFAULT NULL,
  finished_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create neighborhoods table for investment scoring
CREATE TABLE neighborhoods (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL UNIQUE,
  neighborhood_name VARCHAR(100) NOT NULL,
  island VARCHAR(20) NOT NULL,
  overall_score INTEGER DEFAULT NULL,
  roi_potential INTEGER DEFAULT NULL,
  crime_score INTEGER DEFAULT NULL,
  school_score INTEGER DEFAULT NULL,
  appreciation_trend INTEGER DEFAULT NULL,
  tourist_proximity INTEGER DEFAULT NULL,
  investment_grade VARCHAR(1) DEFAULT NULL,
  top_reasons TEXT[] DEFAULT '{}',
  risk_factors TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_channel ON lead_interactions(channel);
CREATE INDEX idx_lead_interactions_created_at ON lead_interactions(created_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_name ON tasks(task_name);
CREATE INDEX idx_neighborhoods_zip_code ON neighborhoods(zip_code);
CREATE INDEX idx_neighborhoods_island ON neighborhoods(island);
CREATE INDEX idx_neighborhoods_overall_score ON neighborhoods(overall_score);

-- Add more advanced fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS str_score INTEGER DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS projected_str_income INTEGER DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS str_last_analyzed TIMESTAMP DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS leasehold_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lease_expiration_date DATE DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment_score INTEGER DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_xai_updated TIMESTAMP DEFAULT NULL;

-- Add advanced lead scoring fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS response_rate DECIMAL(3,2) DEFAULT NULL;

-- Create indexes for new fields
CREATE INDEX idx_properties_str_score ON properties(str_score);
CREATE INDEX idx_properties_investment_score ON properties(investment_score);
CREATE INDEX idx_leads_lead_score ON leads(lead_score);
CREATE INDEX idx_leads_urgency_level ON leads(urgency_level);
