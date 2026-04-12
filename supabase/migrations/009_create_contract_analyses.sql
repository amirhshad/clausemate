-- Contract analyses table for AI skills results
CREATE TABLE IF NOT EXISTS contract_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_type TEXT NOT NULL CHECK (skill_type IN (
        'clause_classification',
        'language_detection',
        'obligation_extraction',
        'financial_modeling',
        'contract_comparison',
        'negotiation_coach',
        'clause_risk_scoring',
        'renewal_decision',
        'portfolio_insights',
        'anomaly_detection',
        'compliance_check',
        'contract_summarization'
    )),
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE contract_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
    ON contract_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analyses"
    ON contract_analyses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete own analyses"
    ON contract_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_analyses_user_id ON contract_analyses(user_id);
CREATE INDEX idx_analyses_contract_id ON contract_analyses(contract_id);
CREATE INDEX idx_analyses_skill_type ON contract_analyses(skill_type);
CREATE INDEX idx_analyses_created_at ON contract_analyses(created_at DESC);
