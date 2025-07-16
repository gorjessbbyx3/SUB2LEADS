
-- Add motivation analysis fields to leads table
ALTER TABLE leads ADD COLUMN motivation_score INTEGER DEFAULT NULL;
ALTER TABLE leads ADD COLUMN motivation_reason TEXT DEFAULT NULL;
ALTER TABLE leads ADD COLUMN motivation_level VARCHAR(10) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN last_motivation_analysis TIMESTAMP DEFAULT NULL;
ALTER TABLE leads ADD COLUMN time_owned INTEGER DEFAULT NULL;
ALTER TABLE leads ADD COLUMN absentee_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN property_condition VARCHAR(20) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN tax_delinquent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN neighborhood VARCHAR(100) DEFAULT NULL;
ALTER TABLE leads ADD COLUMN island VARCHAR(20) DEFAULT 'Oahu';

-- Create index for motivation queries
CREATE INDEX idx_leads_motivation_score ON leads(motivation_score);
CREATE INDEX idx_leads_motivation_level ON leads(motivation_level);
CREATE INDEX idx_leads_last_analysis ON leads(last_motivation_analysis);
