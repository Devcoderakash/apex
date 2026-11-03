# Database & Row-Level Security (RLS) Audit

## Database Architecture
- **Host:** Supabase Managed PostgreSQL
- **Endpoint:** `https://uzhovtxpuqyrtnfzoyuz.supabase.co`

## Table RLS Policy Verification

| Table Name | RLS Enabled | Policies Active | Security Assessment |
|---|---|---|---|
| `public.teams` | YES | Insert (anon/auth), Select (anon/auth for pass retrieval) | SECURE. Dangerous anonymous update policy dropped. |
| `public.team_members` | YES | Insert (anon/auth), Select (anon/auth) | SECURE. Cascade deleted with parent team. |
| `public.consent_records` | YES | Insert (anon/auth), Select (admin only) | SECURE. Audit records protected from modification. |
| `public.grievances` | YES | Insert (anon/auth), Select by complaint_id | SECURE. Sensitive descriptions shielded. |
| `public.privacy_requests` | YES | Insert (anon/auth), Select by request_id | SECURE. Protected against enumeration. |
| `public.event_settings` | YES | Select (public), Write (admin/service_role) | SECURE. Event dates and prize pool immutable by anon. |
| `public.registration_emails` | YES | Service role only | SECURE. Email delivery audit logs shielded. |
| `public.user_roles` | YES | Select (authenticated own UID) | SECURE. Strict RBAC role enforcement. |
| `storage.objects` (`apex-presentations`) | YES | Insert & Select policies scoped to bucket | SECURE. 20MB limit and mime restrictions active. |
