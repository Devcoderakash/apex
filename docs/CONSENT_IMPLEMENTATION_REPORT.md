# Consent Implementation Report — DPDP Section 6 Compliance

## Architecture of Decoupled Consent
Under Section 6 of the DPDP Act 2023, consent must be **free, specific, informed, unconditional, and unambiguous**.

### Implementation Details:
1. **Mandatory Service Processing:**
   - Single checkbox required to accept the Official Rules, Terms & Conditions, and Privacy Policy.
   - Purpose: Validating team credentials, uploading presentations, and executing Razorpay transactions.

2. **Decoupled Optional Consents (Unchecked by Default):**
   - **Email Marketing & Partner Opportunities:** Opt-in for newsletters and sponsor hackathons.
   - **SMS Critical Alerts:** Opt-in for SMS reminders and deadline notices.
   - **WhatsApp Community & Mentorship:** Opt-in for mentor room access and fast-track alerts.

3. **Audit Logging in Supabase:**
   Every registration inserts immutable audit entries into `public.consent_records` containing:
   - `team_id`, `player_id`, `email`
   - `consent_purpose` (`service_essential`, `marketing_email`, `marketing_sms`, `marketing_whatsapp`)
   - `consent_given` (boolean)
   - `consent_version` (`2026.1`)
   - `timestamp`
