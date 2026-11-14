-- ==============================================================================
-- APEX 1.0 — Email Dispatch & Delivery Audit Logging Migration
-- Table: public.registration_emails
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.registration_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  team_id UUID,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'registration_confirmation', 'admin_notification'
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, delivered, failed
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_emails_player_type_unique UNIQUE (player_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_registration_emails_player_id ON public.registration_emails (player_id);
CREATE INDEX IF NOT EXISTS idx_registration_emails_status ON public.registration_emails (status);
CREATE INDEX IF NOT EXISTS idx_registration_emails_type ON public.registration_emails (email_type);

ALTER TABLE public.registration_emails ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.registration_emails TO service_role;
GRANT SELECT ON public.registration_emails TO anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on registration_emails" ON public.registration_emails;
CREATE POLICY "Service role full access on registration_emails"
  ON public.registration_emails FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on registration_emails" ON public.registration_emails;
CREATE POLICY "Allow public select on registration_emails"
  ON public.registration_emails FOR SELECT TO anon, authenticated
  USING (true);
