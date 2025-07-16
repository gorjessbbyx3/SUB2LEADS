
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

-- Add risk assessment fields
ALTER TABLE leads ADD COLUMN zoning_change_potential BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN development_zone_risk VARCHAR(50) DEFAULT 'None';
ALTER TABLE leads ADD COLUMN natural_disaster_risk VARCHAR(50) DEFAULT 'Unknown';
ALTER TABLE leads ADD COLUMN wildfire_risk_zone VARCHAR(20) DEFAULT 'Unknown';
ALTER TABLE leads ADD COLUMN flood_zone VARCHAR(10) DEFAULT 'Unknown';
ALTER TABLE leads ADD COLUMN lava_zone INTEGER DEFAULT NULL;
ALTER TABLE leads ADD COLUMN tsunami_evacuation_zone BOOLEAN DEFAULT FALSE;

-- Create index for motivation queries
CREATE INDEX idx_leads_motivation_score ON leads(motivation_score);
CREATE INDEX idx_leads_motivation_level ON leads(motivation_level);
CREATE INDEX idx_leads_last_analysis ON leads(last_motivation_analysis);
CREATE INDEX idx_leads_natural_disaster_risk ON leads(natural_disaster_risk);
CREATE INDEX idx_leads_development_zone_risk ON leads(development_zone_risk);
CREATE INDEX idx_leads_wildfire_risk ON leads(wildfire_risk_zone);
