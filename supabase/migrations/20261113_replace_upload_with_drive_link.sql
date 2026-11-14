-- ============================================================
-- Migration: Replace PPT/PDF file upload fields with Google Drive link
-- APEX 1.0 Hackathon System
-- Safe migration: adds idea_drive_link, migrates existing data,
-- preserves all existing registration records, keeps backward compatibility.
-- ============================================================

-- 1. Safely add idea_drive_link column to public.teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS idea_drive_link TEXT;

-- 2. Migrate existing records: copy existing ppt_url if present
UPDATE public.teams
SET idea_drive_link = ppt_url
WHERE idea_drive_link IS NULL AND ppt_url IS NOT NULL AND ppt_url != '';

-- 3. For any remaining null rows in existing test data, set placeholder
UPDATE public.teams
SET idea_drive_link = 'https://drive.google.com/file/d/migrated_record'
WHERE idea_drive_link IS NULL;

-- 4. Enforce NOT NULL constraint for all future registrations
ALTER TABLE public.teams
  ALTER COLUMN idea_drive_link SET NOT NULL;

-- 5. Add documentation comments
COMMENT ON COLUMN public.teams.idea_drive_link IS 'Shareable Google Drive link for idea presentation (PDF/PPT/PPTX, Viewer access)';
COMMENT ON COLUMN public.teams.ppt_url IS 'DEPRECATED: Legacy presentation URL field, retained for backward compatibility';
COMMENT ON COLUMN public.teams.ppt_storage_path IS 'DEPRECATED: Legacy Supabase storage path, replaced by idea_drive_link';
COMMENT ON COLUMN public.teams.ppt_file_name IS 'DEPRECATED: File upload replaced by Google Drive link';
COMMENT ON COLUMN public.teams.ppt_file_type IS 'DEPRECATED: File upload replaced by Google Drive link';
COMMENT ON COLUMN public.teams.ppt_file_size IS 'DEPRECATED: File upload replaced by Google Drive link';

-- 6. Optional view alias for apex_registrations
CREATE OR REPLACE VIEW public.apex_registrations AS
  SELECT * FROM public.teams;

GRANT ALL ON public.apex_registrations TO service_role;
GRANT SELECT ON public.apex_registrations TO authenticated, anon;

