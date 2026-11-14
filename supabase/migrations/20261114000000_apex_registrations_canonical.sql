-- ==============================================================================
-- APEX 1.0 — CANONICAL DATABASE ARCHITECTURE MIGRATION
-- Main Table: public.apex_registrations
-- Standard: PostgreSQL 15+ / Supabase
-- Description: Production-ready hackathon registration architecture with
-- cryptographically secure R_ID, strict JSONB constraints, Razorpay payment
-- integrity, Google Drive validation, and Row-Level Security.
-- ==============================================================================

-- Ensure pgcrypto extension is available for random UUID / crypto helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Cryptographically Secure R_ID Generator Function
-- Format: APEX-XXXXXXXXXXXXXXX (APEX- followed by 15 uppercase alphanumeric chars)
-- Example: APEX-A7K9X2M4P8Q1W3Z
-- Uses unambiguous alphabet (excludes 0, 1, I, O to prevent transcription errors)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_apex_r_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  res text := 'APEX-';
  i integer;
  rand_val integer;
  byte_buf bytea;
BEGIN
  -- Generate 15 cryptographically secure random bytes
  byte_buf := gen_random_bytes(15);
  FOR i IN 0..14 LOOP
    rand_val := get_byte(byte_buf, i);
    res := res || substr(alphabet, (rand_val % length(alphabet)) + 1, 1);
  END LOOP;
  RETURN res;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Primary Table: public.apex_registrations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.apex_registrations (
  -- 1. Internal Database ID (UUID, never exposed as registration number)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 2. Unique Registration ID — R_ID (APEX-XXXXXXXXXXXXXXX)
  r_id TEXT NOT NULL UNIQUE,

  -- 3. Team Information
  team_name TEXT NOT NULL,
  team_leader_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college_organization TEXT NOT NULL,
  team_size INTEGER NOT NULL,

  -- 4. Additional Members (JSONB Array of member names)
  -- Team size 1 -> [], Team size 2 -> [1], Team size 3 -> [2], Team size 4 -> [3]
  additional_members JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 5. Profile & Social Links (Optional)
  preferred_domain TEXT,
  github_url TEXT,
  linkedin_url TEXT,

  -- 6. Idea Submission — Google Drive (Mandatory HTTPS Google Drive / Docs URL)
  idea_drive_link TEXT NOT NULL,

  -- 7. Terms & Conditions
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 8. Razorpay Payment Information
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  amount_paid INTEGER NOT NULL DEFAULT 1000,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_verified_at TIMESTAMPTZ,

  -- 9. Registration Status
  registration_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 10. Admin Review Fields
  review_status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,

  -- --------------------------------------------------------------------------
  -- Database Constraints
  -- --------------------------------------------------------------------------
  -- Team size validation: 1 to 4 members
  CONSTRAINT check_team_size CHECK (
    team_size >= 1 AND team_size <= 4
  ),

  -- Additional members JSONB type validation: must be a JSON array
  CONSTRAINT check_additional_members_type CHECK (
    jsonb_typeof(additional_members) = 'array'
  ),

  -- Member count constraint: additional_members count must equal team_size - 1
  CONSTRAINT check_additional_members_count CHECK (
    jsonb_typeof(additional_members) = 'array' AND
    jsonb_array_length(additional_members) = (team_size - 1)
  ),

  -- Google Drive Link constraint: must be HTTPS drive.google.com or docs.google.com
  CONSTRAINT check_idea_drive_link_format CHECK (
    idea_drive_link ~* '^https:\/\/(drive\.google\.com|docs\.google\.com)\/'
  ),

  -- Terms acceptance constraint: must be TRUE
  CONSTRAINT check_terms_accepted CHECK (
    terms_accepted = TRUE
  ),

  -- Payment status validation
  CONSTRAINT check_payment_status CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded')
  ),

  -- Registration status validation
  CONSTRAINT check_registration_status CHECK (
    registration_status IN ('pending', 'confirmed', 'cancelled')
  ),

  -- Review status validation
  CONSTRAINT check_review_status CHECK (
    review_status IN ('pending', 'shortlisted', 'rejected')
  ),

  -- Amount paid validation (paise)
  CONSTRAINT check_amount_paid CHECK (
    amount_paid >= 0
  )
);

-- ------------------------------------------------------------------------------
-- 3. Automatic Triggers
-- ------------------------------------------------------------------------------

-- Trigger 1: Automatic R_ID Generation & Validation BEFORE INSERT
CREATE OR REPLACE FUNCTION public.trg_apex_registrations_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  collision boolean := true;
  attempts integer := 0;
BEGIN
  -- Auto-generate unique R_ID if not supplied
  IF NEW.r_id IS NULL OR NEW.r_id = '' THEN
    WHILE collision AND attempts < 15 LOOP
      NEW.r_id := public.generate_apex_r_id();
      collision := EXISTS(SELECT 1 FROM public.apex_registrations WHERE r_id = NEW.r_id);
      attempts := attempts + 1;
    END LOOP;
    IF collision THEN
      RAISE EXCEPTION 'Failed to generate unique R_ID after maximum retry attempts';
    END IF;
  END IF;

  -- Validate R_ID pattern: APEX- followed by exactly 15 alphanumeric characters
  IF NEW.r_id !~ '^APEX-[A-Z0-9]{15}$' THEN
    RAISE EXCEPTION 'Invalid R_ID format "%": must match APEX-XXXXXXXXXXXXXXX', NEW.r_id;
  END IF;

  -- Automatic terms timestamp
  IF NEW.terms_accepted AND NEW.terms_accepted_at IS NULL THEN
    NEW.terms_accepted_at := now();
  END IF;

  -- Synchronize verified payment status
  IF NEW.payment_status = 'paid' THEN
    IF NEW.payment_verified_at IS NULL THEN
      NEW.payment_verified_at := now();
    END IF;
    NEW.registration_status := 'confirmed';
  END IF;

  NEW.created_at := coalesce(NEW.created_at, now());
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apex_registrations_insert ON public.apex_registrations;
CREATE TRIGGER trg_apex_registrations_insert
BEFORE INSERT ON public.apex_registrations
FOR EACH ROW EXECUTE FUNCTION public.trg_apex_registrations_before_insert();


-- Trigger 2: Immutability & Updated_At BEFORE UPDATE
CREATE OR REPLACE FUNCTION public.trg_apex_registrations_before_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Strict Rule: R_ID is permanent and immutable
  IF NEW.r_id IS DISTINCT FROM OLD.r_id THEN
    RAISE EXCEPTION 'R_ID is permanent and cannot be modified';
  END IF;

  -- Strict Rule: Verified payment fields cannot be altered by standard updates
  IF OLD.payment_status = 'paid' THEN
    IF NEW.amount_paid IS DISTINCT FROM OLD.amount_paid THEN
      RAISE EXCEPTION 'Verified payment amount cannot be modified';
    END IF;
    IF NEW.currency IS DISTINCT FROM OLD.currency THEN
      RAISE EXCEPTION 'Verified payment currency cannot be modified';
    END IF;
    IF NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id THEN
      RAISE EXCEPTION 'Verified razorpay_order_id cannot be modified';
    END IF;
    IF NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id THEN
      RAISE EXCEPTION 'Verified razorpay_payment_id cannot be modified';
    END IF;
  END IF;

  -- Auto-mark confirmed when transitioning to paid
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    NEW.payment_verified_at := coalesce(NEW.payment_verified_at, now());
    NEW.registration_status := 'confirmed';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apex_registrations_update ON public.apex_registrations;
CREATE TRIGGER trg_apex_registrations_update
BEFORE UPDATE ON public.apex_registrations
FOR EACH ROW EXECUTE FUNCTION public.trg_apex_registrations_before_update();

-- ------------------------------------------------------------------------------
-- 4. High-Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_apex_reg_r_id          ON public.apex_registrations (r_id);
CREATE INDEX IF NOT EXISTS idx_apex_reg_email         ON public.apex_registrations (email);
CREATE INDEX IF NOT EXISTS idx_apex_reg_pay_status    ON public.apex_registrations (payment_status);
CREATE INDEX IF NOT EXISTS idx_apex_reg_reg_status    ON public.apex_registrations (registration_status);
CREATE INDEX IF NOT EXISTS idx_apex_reg_review_status ON public.apex_registrations (review_status);
CREATE INDEX IF NOT EXISTS idx_apex_reg_rzp_order     ON public.apex_registrations (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_apex_reg_created_at    ON public.apex_registrations (created_at DESC);

-- Composite index for admin searches
CREATE INDEX IF NOT EXISTS idx_apex_reg_admin_search  ON public.apex_registrations (team_name text_pattern_ops, team_leader_name text_pattern_ops);

-- ------------------------------------------------------------------------------
-- 5. Data Migration from legacy public.teams (if table exists)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
      EXECUTE $migration$
        WITH member_agg AS (
          SELECT
            m.team_id,
            coalesce(jsonb_agg(m.full_name ORDER BY m.position), '[]'::jsonb) AS members_json,
            count(*)::integer AS member_cnt
          FROM public.team_members m
          GROUP BY m.team_id
        )
        INSERT INTO public.apex_registrations (
          id,
          r_id,
          team_name,
          team_leader_name,
          email,
          phone,
          college_organization,
          team_size,
          additional_members,
          preferred_domain,
          github_url,
          linkedin_url,
          idea_drive_link,
          terms_accepted,
          terms_accepted_at,
          razorpay_order_id,
          razorpay_payment_id,
          payment_status,
          amount_paid,
          currency,
          payment_verified_at,
          registration_status,
          review_status,
          created_at,
          updated_at
        )
        SELECT
          t.id,
          CASE
            WHEN t.player_id ~ '^APEX-[A-Z0-9]{15}$' THEN t.player_id
            ELSE 'APEX-' || upper(substr(md5(t.id::text || 'apex_salt_1'), 1, 15))
          END AS r_id,
          t.team_name,
          coalesce(nullif(t.leader_name, ''), 'Team Leader'),
          t.email,
          coalesce(nullif(t.phone, ''), '+91 0000000000'),
          coalesce(nullif(t.college, ''), 'Institution'),
          1 + coalesce(m.member_cnt, 0) AS team_size,
          coalesce(m.members_json, '[]'::jsonb) AS additional_members,
          t.preferred_domain,
          t.github_url,
          t.linkedin_url,
          coalesce(
            nullif(t.idea_drive_link, ''),
            nullif(t.ppt_url, ''),
            'https://drive.google.com/file/d/migrated_legacy_record'
          ) AS idea_drive_link,
          true AS terms_accepted,
          coalesce(t.created_at, now()) AS terms_accepted_at,
          t.razorpay_order_id,
          t.payment_id AS razorpay_payment_id,
          CASE WHEN t.payment_status = 'paid' THEN 'paid' ELSE 'pending' END AS payment_status,
          coalesce(t.payment_amount, 19900) AS amount_paid,
          coalesce(t.payment_currency, 'INR') AS currency,
          t.paid_at AS payment_verified_at,
          CASE WHEN t.payment_status = 'paid' THEN 'confirmed' ELSE 'pending' END AS registration_status,
          CASE
            WHEN t.status = 'approved' THEN 'shortlisted'
            WHEN t.status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END AS review_status,
          coalesce(t.created_at, now()) AS created_at,
          coalesce(t.updated_at, now()) AS updated_at
        FROM public.teams t
        LEFT JOIN member_agg m ON m.team_id = t.id
        ON CONFLICT (id) DO NOTHING;
      $migration$;
    ELSE
      EXECUTE $migration_no_members$
        INSERT INTO public.apex_registrations (
          id,
          r_id,
          team_name,
          team_leader_name,
          email,
          phone,
          college_organization,
          team_size,
          additional_members,
          preferred_domain,
          github_url,
          linkedin_url,
          idea_drive_link,
          terms_accepted,
          terms_accepted_at,
          razorpay_order_id,
          razorpay_payment_id,
          payment_status,
          amount_paid,
          currency,
          payment_verified_at,
          registration_status,
          review_status,
          created_at,
          updated_at
        )
        SELECT
          t.id,
          CASE
            WHEN t.player_id ~ '^APEX-[A-Z0-9]{15}$' THEN t.player_id
            ELSE 'APEX-' || upper(substr(md5(t.id::text || 'apex_salt_1'), 1, 15))
          END AS r_id,
          t.team_name,
          coalesce(nullif(t.leader_name, ''), 'Team Leader'),
          t.email,
          coalesce(nullif(t.phone, ''), '+91 0000000000'),
          coalesce(nullif(t.college, ''), 'Institution'),
          1 AS team_size,
          '[]'::jsonb AS additional_members,
          t.preferred_domain,
          t.github_url,
          t.linkedin_url,
          coalesce(
            nullif(t.idea_drive_link, ''),
            nullif(t.ppt_url, ''),
            'https://drive.google.com/file/d/migrated_legacy_record'
          ) AS idea_drive_link,
          true AS terms_accepted,
          coalesce(t.created_at, now()) AS terms_accepted_at,
          t.razorpay_order_id,
          t.payment_id AS razorpay_payment_id,
          CASE WHEN t.payment_status = 'paid' THEN 'paid' ELSE 'pending' END AS payment_status,
          coalesce(t.payment_amount, 19900) AS amount_paid,
          coalesce(t.payment_currency, 'INR') AS currency,
          t.paid_at AS payment_verified_at,
          CASE WHEN t.payment_status = 'paid' THEN 'confirmed' ELSE 'pending' END AS registration_status,
          CASE
            WHEN t.status = 'approved' THEN 'shortlisted'
            WHEN t.status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END AS review_status,
          coalesce(t.created_at, now()) AS created_at,
          coalesce(t.updated_at, now()) AS updated_at
        FROM public.teams t
        ON CONFLICT (id) DO NOTHING;
      $migration_no_members$;
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Row-Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.apex_registrations ENABLE ROW LEVEL SECURITY;

-- Service role full access (Backend Server operations)
DROP POLICY IF EXISTS "service_role_manage_all" ON public.apex_registrations;
CREATE POLICY "service_role_manage_all"
  ON public.apex_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated Admin read-all policy
DROP POLICY IF EXISTS "admin_read_all" ON public.apex_registrations;
CREATE POLICY "admin_read_all"
  ON public.apex_registrations
  FOR SELECT
  TO authenticated
  USING (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- Authenticated Admin update review policy (allows updating review_status and admin_notes only)
DROP POLICY IF EXISTS "admin_update_review" ON public.apex_registrations;
CREATE POLICY "admin_update_review"
  ON public.apex_registrations
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- Anonymous / Public users have NO direct write or read access to registrations.
-- All registration queries and payment creations go through authenticated backend routes.

-- ------------------------------------------------------------------------------
-- 7. Grant Permissions
-- ------------------------------------------------------------------------------
GRANT ALL ON public.apex_registrations TO service_role;
GRANT SELECT, UPDATE ON public.apex_registrations TO authenticated;

-- ------------------------------------------------------------------------------
-- 8. Backward Compatibility View for Legacy Queries
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.teams AS
  SELECT
    id,
    r_id AS player_id,
    team_name,
    team_leader_name AS leader_name,
    email,
    phone,
    college_organization AS college,
    team_size,
    'spades'::text AS suit,
    preferred_domain,
    github_url,
    linkedin_url,
    CASE
      WHEN review_status = 'shortlisted' THEN 'approved'
      WHEN review_status = 'rejected' THEN 'rejected'
      ELSE 'pending'
    END AS status,
    idea_drive_link AS ppt_url,
    NULL::text AS ppt_file_name,
    NULL::text AS ppt_file_type,
    NULL::bigint AS ppt_file_size,
    NULL::text AS ppt_storage_path,
    idea_drive_link,
    payment_status,
    razorpay_payment_id AS payment_id,
    razorpay_order_id,
    razorpay_order_id AS payment_order_id,
    NULL::text AS cashfree_order_id,
    NULL::text AS payment_signature,
    amount_paid AS payment_amount,
    currency AS payment_currency,
    payment_verified_at AS paid_at,
    created_at,
    updated_at
  FROM public.apex_registrations;

GRANT ALL ON public.teams TO service_role;
GRANT SELECT ON public.teams TO authenticated, anon;

COMMENT ON TABLE public.apex_registrations IS 'Primary registration table for APEX 1.0 National Hackathon';
COMMENT ON COLUMN public.apex_registrations.r_id IS 'Unique participant registration ID (Format: APEX-XXXXXXXXXXXXXXX)';
COMMENT ON COLUMN public.apex_registrations.idea_drive_link IS 'Shareable Google Drive presentation link with Viewer permissions';

