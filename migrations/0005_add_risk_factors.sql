
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
