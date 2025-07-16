
-- Add advanced AI + market intelligence fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivation_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivation_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS leasehold_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS str_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS str_income_estimate NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS roi_estimate NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_xai_updated TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tax_delinquent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS years_owned INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS absentee_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS foreclosure_notice BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_condition TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS island TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Add interaction tracking table
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'sms', 'call')),
  message TEXT,
  sentiment_score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_motivation_score ON leads(motivation_score);
CREATE INDEX IF NOT EXISTS idx_leads_last_xai_updated ON leads(last_xai_updated);
