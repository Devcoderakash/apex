-- ==============================================================================
-- Migration: 20261114000001_update_registration_fee_to_10.sql
-- Description: Updates the registration entry fee from ₹199 (19900 paise) to ₹10 (1000 paise).
-- Table: public.apex_registrations
-- Column: amount_paid
-- ==============================================================================

-- 1. Alter default value of amount_paid to 1000 paise (₹10 INR)
ALTER TABLE IF EXISTS public.apex_registrations 
  ALTER COLUMN amount_paid SET DEFAULT 1000;

-- 2. Add documentation comment
COMMENT ON COLUMN public.apex_registrations.amount_paid IS 'Amount paid in paise (e.g. 1000 = ₹10)';
