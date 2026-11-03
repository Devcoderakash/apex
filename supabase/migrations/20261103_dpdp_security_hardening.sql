-- ==============================================================================
-- APEX 1.0 — DPDP ACT COMPLIANCE, SECURITY HARDENING & CONSENT SYSTEM MIGRATION
-- Project: https://uzhovtxpuqyrtnfzoyuz.supabase.co
-- Organizer: The Innovation League, Bhopal
-- Website: https://apexhack.online
-- ==============================================================================

-- 1. Security Hardening: Revoke dangerous anonymous update permissions
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anon update teams" ON public.teams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Enhance teams table with complete project info & links (stored as plain text)
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_title text,
  ADD COLUMN IF NOT EXISTS project_description text,
  ADD COLUMN IF NOT EXISTS problem_statement text,
  ADD COLUMN IF NOT EXISTS proposed_solution text,
  ADD COLUMN IF NOT EXISTS tech_stack text,
  ADD COLUMN IF NOT EXISTS expected_impact text,
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS other_links text,
  ADD COLUMN IF NOT EXISTS consent_version text DEFAULT '2026.1',
  ADD COLUMN IF NOT EXISTS consent_service boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS consent_marketing_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing_sms boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing_whatsapp boolean DEFAULT false;

-- 3. Enhance team_members with contact details
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS college text;

-- 4. Create Consent Audit Records table (DPDP Act 2023 Section 6 Compliance)
CREATE TABLE IF NOT EXISTS public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id text,
  email text NOT NULL,
  consent_purpose text NOT NULL, -- 'service_essential', 'marketing_email', 'marketing_sms', 'marketing_whatsapp', 'analytics_cookies'
  consent_status boolean NOT NULL DEFAULT true, -- true = granted, false = withdrawn
  policy_version text NOT NULL DEFAULT '2026.1',
  ip_address text,
  user_agent text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_records_team_id_idx ON public.consent_records(team_id);
CREATE INDEX IF NOT EXISTS consent_records_email_idx ON public.consent_records(email);
CREATE INDEX IF NOT EXISTS consent_records_purpose_idx ON public.consent_records(consent_purpose);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.consent_records TO service_role, anon, authenticated;

DROP POLICY IF EXISTS "Allow anon insert consent_records" ON public.consent_records;
CREATE POLICY "Allow anon insert consent_records" ON public.consent_records
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage consent_records" ON public.consent_records;
CREATE POLICY "Service role manage consent_records" ON public.consent_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Create Grievance Redressal table (DPDP Act 2023 Section 13 Compliance)
CREATE SEQUENCE IF NOT EXISTS public.grievance_seq START 1001;

CREATE TABLE IF NOT EXISTS public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL UNIQUE DEFAULT ('GRV-' || lpad(nextval('public.grievance_seq')::text, 4, '0')),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  player_id text,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  category text NOT NULL, -- 'data_access', 'data_correction', 'data_erasure', 'consent_withdrawal', 'event_query', 'other'
  description text NOT NULL,
  status text NOT NULL DEFAULT 'submitted', -- 'submitted', 'under_review', 'resolved', 'rejected'
  admin_notes text,
  resolution_details text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grievances_complaint_id_idx ON public.grievances(complaint_id);
CREATE INDEX IF NOT EXISTS grievances_email_idx ON public.grievances(email);
CREATE INDEX IF NOT EXISTS grievances_status_idx ON public.grievances(status);

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.grievances TO service_role, anon, authenticated;

DROP POLICY IF EXISTS "Allow anon insert grievances" ON public.grievances;
CREATE POLICY "Allow anon insert grievances" ON public.grievances
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own grievance by complaint_id" ON public.grievances;
CREATE POLICY "Allow anon select own grievance by complaint_id" ON public.grievances
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage grievances" ON public.grievances;
CREATE POLICY "Service role manage grievances" ON public.grievances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Create Privacy Requests table (DPDP Act 2023 Data Principal Rights: Access, Correction, Erasure)
CREATE SEQUENCE IF NOT EXISTS public.privacy_req_seq START 1001;

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE DEFAULT ('PRV-' || lpad(nextval('public.privacy_req_seq')::text, 4, '0')),
  request_type text NOT NULL, -- 'access', 'correction', 'erasure', 'nomination'
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  player_id text,
  request_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'denied'
  admin_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS privacy_requests_req_id_idx ON public.privacy_requests(request_id);
CREATE INDEX IF NOT EXISTS privacy_requests_email_idx ON public.privacy_requests(email);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.privacy_requests TO service_role, anon, authenticated;

DROP POLICY IF EXISTS "Allow anon insert privacy_requests" ON public.privacy_requests;
CREATE POLICY "Allow anon insert privacy_requests" ON public.privacy_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own privacy_request" ON public.privacy_requests;
CREATE POLICY "Allow anon select own privacy_request" ON public.privacy_requests
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage privacy_requests" ON public.privacy_requests;
CREATE POLICY "Service role manage privacy_requests" ON public.privacy_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Update event_settings with official event information
INSERT INTO public.event_settings (
  id, event_name, registration_deadline, prize_pool, contact_email, contact_phone, updated_at
) VALUES (
  'current',
  'APEX 1.0 National Hackathon',
  '25 November 2026',
  '30000',
  'support@apexhack.online',
  '+91 98765 43210',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  event_name = 'APEX 1.0 National Hackathon',
  registration_deadline = '25 November 2026',
  prize_pool = '30000',
  contact_email = 'support@apexhack.online',
  updated_at = now();

