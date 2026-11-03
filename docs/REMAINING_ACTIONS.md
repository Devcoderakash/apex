# Remaining Recommended Actions for Project Team

1. **Supabase Database Hardening:** Run `supabase/migrations/20261103_dpdp_security_hardening.sql` in the Supabase SQL Editor to ensure all compliance tables (`consent_records`, `grievances`, `privacy_requests`) are active and `event_settings` holds the official Bhopal dates.
2. **Vercel Frontend Redeploy:** In the Vercel dashboard for `apexhack.online`, trigger a "Redeploy" so that the latest commit with all compliance routes and live backend configurations is published.
3. **Razorpay Live Activation Check:** Ensure the Razorpay account status is fully activated in Live Mode for UPI QR and NetBanking merchant collections.
