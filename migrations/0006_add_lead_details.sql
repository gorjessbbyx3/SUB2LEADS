
-- Add financing type, ownership details, and contracting types to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS financing_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS ownership_details TEXT,
ADD COLUMN IF NOT EXISTS contracting_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS contracting_details TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_leads_financing_type ON leads(financing_type);
CREATE INDEX IF NOT EXISTS idx_leads_ownership_type ON leads(ownership_type);
CREATE INDEX IF NOT EXISTS idx_leads_contracting_type ON leads(contracting_type);

-- Add comments for documentation
COMMENT ON COLUMN leads.financing_type IS 'Type of financing: cash, conventional, hard_money, private_lender, owner_finance, other';
COMMENT ON COLUMN leads.ownership_type IS 'Type of ownership: individual, llc, corporation, trust, partnership, other';
COMMENT ON COLUMN leads.contracting_type IS 'Type of contracting: wholesale, assignment, double_close, bird_dog, direct_purchase, other';
