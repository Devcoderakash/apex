-- ==============================================================================
-- Migration: 20261121000000_update_registration_fee_to_199.sql
-- Description: Updates the registration entry fee from ₹10 (1000 paise) to ₹199 (19900 paise).
-- Table: public.apex_registrations
-- Column: amount_paid
-- ==============================================================================

-- 1. Alter default value of amount_paid to 19900 paise (₹199 INR)
ALTER TABLE IF EXISTS public.apex_registrations 
  ALTER COLUMN amount_paid SET DEFAULT 19900;

-- 2. Add documentation comment
COMMENT ON COLUMN public.apex_registrations.amount_paid IS 'Amount paid in paise (e.g. 19900 = ₹199)';
