-- ============================================================================
-- NEXUS: Financial Identity & Trust Network
-- Initial Database Schema & Security Policies
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    occupation TEXT CHECK (occupation IN ('Student', 'Freelancer', 'Salaried', 'Gig Worker', 'Small Business Owner', 'Other')),
    monthly_income_range TEXT,
    location TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. USER CONSENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- e.g., 'financial_analysis', 'passport_sharing', 'data_storage'
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    terms_version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
    ON public.user_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
    ON public.user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. FINANCIAL RECORDS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('Income', 'Expense', 'Savings', 'Repayment')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    record_date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_financial_records_user_date 
    ON public.financial_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_type 
    ON public.financial_records(user_id, record_type);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial records"
    ON public.financial_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial records"
    ON public.financial_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial records"
    ON public.financial_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial records"
    ON public.financial_records FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. FINANCIAL ANALYSES TABLE (Historical & Auditable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_income NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_remaining NUMERIC(12, 2) NOT NULL DEFAULT 0,
    income_consistency_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    savings_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_summary TEXT NOT NULL,
    positive_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    areas_for_attention JSONB NOT NULL DEFAULT '[]'::jsonb,
    actionable_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_used TEXT DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_financial_analyses_user 
    ON public.financial_analyses(user_id, created_at DESC);

ALTER TABLE public.financial_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
    ON public.financial_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
    ON public.financial_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. FINANCIAL PASSPORTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.financial_analyses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Archived')),
    headline TEXT NOT NULL,
    income_stability_label TEXT NOT NULL,
    repayment_discipline_label TEXT NOT NULL,
    savings_habit_label TEXT NOT NULL,
    passport_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_financial_passports_user 
    ON public.financial_passports(user_id, created_at DESC);

ALTER TABLE public.financial_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passport"
    ON public.financial_passports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passport"
    ON public.financial_passports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passport"
    ON public.financial_passports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. PASSPORT SHARE LINKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passport_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    passport_id UUID NOT NULL REFERENCES public.financial_passports(id) ON DELETE CASCADE,
    share_token_hash TEXT NOT NULL UNIQUE,
    recipient_label TEXT,
    included_fields JSONB NOT NULL DEFAULT '["summary", "income_consistency", "repayments", "suggestions"]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_passport_share_token 
    ON public.passport_share_links(share_token_hash);

ALTER TABLE public.passport_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own share links"
    ON public.passport_share_links FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. SUPPORTING DOCUMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supporting_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('Bank Statement', 'Freelance Invoice', 'Utility Bill', 'Rent Agreement', 'Salary Slip', 'Other')),
    status TEXT NOT NULL DEFAULT 'Uploaded' CHECK (status IN ('Uploaded', 'Processing', 'Reviewed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.supporting_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
    ON public.supporting_documents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. SECURE PUBLIC FUNCTION TO READ SHARED PASSPORT BY TOKEN HASH
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_shared_passport(token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    link_rec RECORD;
    pass_rec RECORD;
    prof_rec RECORD;
    result JSONB;
BEGIN
    -- 1. Find share link
    SELECT * INTO link_rec
    FROM public.passport_share_links
    WHERE share_token_hash = token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'SHARE_NOT_FOUND', 'message', 'This share link does not exist.');
    END IF;

    -- 2. Check revoked
    IF link_rec.is_revoked THEN
        RETURN jsonb_build_object('error', 'SHARE_REVOKED', 'message', 'Access to this Financial Trust Passport has been revoked by the owner.');
    END IF;

    -- 3. Check expiration
    IF link_rec.expires_at < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('error', 'SHARE_EXPIRED', 'message', 'This share link has expired.');
    END IF;

    -- 4. Increment access count
    UPDATE public.passport_share_links
    SET access_count = access_count + 1,
        last_accessed_at = timezone('utc'::text, now())
    WHERE id = link_rec.id;

    -- 5. Fetch passport and profile
    SELECT * INTO pass_rec FROM public.financial_passports WHERE id = link_rec.passport_id;
    SELECT * INTO prof_rec FROM public.profiles WHERE id = link_rec.user_id;

    -- 6. Filter fields based on link_rec.included_fields
    result := jsonb_build_object(
        'share_id', link_rec.id,
        'recipient_label', link_rec.recipient_label,
        'expires_at', link_rec.expires_at,
        'owner_name', prof_rec.full_name,
        'owner_occupation', prof_rec.occupation,
        'passport_headline', pass_rec.headline,
        'income_stability_label', pass_rec.income_stability_label,
        'repayment_discipline_label', pass_rec.repayment_discipline_label,
        'savings_habit_label', pass_rec.savings_habit_label,
        'created_at', pass_rec.created_at,
        'included_fields', link_rec.included_fields,
        'passport_data', pass_rec.passport_data
    );

    RETURN result;
END;
$$;

-- Grant execution of the public reader function to anonymous visitors
GRANT EXECUTE ON FUNCTION public.get_shared_passport(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, occupation, onboarding_completed)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nexus User'),
        COALESCE(new.raw_user_meta_data->>'occupation', 'Other'),
        FALSE
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 10. STORAGE BUCKET CONFIGURATION FOR SUPPORTING DOCUMENTS
-- ----------------------------------------------------------------------------
-- Insert bucket if storage schema exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'financial-documents',
    'financial-documents',
    FALSE,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only upload and read files in their own folder (folder name is their user_id)
CREATE POLICY "Users can upload own documents to financial-documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'financial-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own documents in financial-documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'financial-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own documents in financial-documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'financial-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

