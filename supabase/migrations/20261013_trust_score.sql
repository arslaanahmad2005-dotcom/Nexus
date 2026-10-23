-- ============================================================================
-- Migration: 20261013_trust_score.sql
-- Description: Non-destructive addition of Financial Trust Score and period fields
-- Preserves: All existing RLS policies, tables, and foreign keys
-- ============================================================================

-- 1. Add trust_score and period columns to financial_analyses if not present
ALTER TABLE public.financial_analyses
    ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS period TEXT DEFAULT 'all_time',
    ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT 'v1.0';

-- 2. Add trust_score column to financial_passports if not present
ALTER TABLE public.financial_passports
    ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT 'v1.0';

-- 3. Index for querying analyses by period
CREATE INDEX IF NOT EXISTS idx_financial_analyses_period 
    ON public.financial_analyses(user_id, period, created_at DESC);

COMMENT ON COLUMN public.financial_analyses.trust_score IS 'NEXUS deterministic Financial Trust Score (0-100 scale)';
COMMENT ON COLUMN public.financial_passports.trust_score IS 'Certified Financial Trust Score stored on the passport';
