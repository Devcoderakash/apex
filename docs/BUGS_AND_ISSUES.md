# APEX 1.0 — Bugs, Technical Debts & Issues Report

This report documents all verified bugs, logic anomalies, architectural gaps, and vulnerabilities discovered during the technical audit of the APEX 1.0 codebase.

---

## Issue Summary Matrix

| ID | Issue Title | Location | Severity | Category |
|---|---|---|---|---|
| **BUG-01** | Unprotected Admin Dashboard (Direct Access) | `frontend/src/components/admin/admin-shell.tsx` | **CRITICAL** | Security / Auth |
| **BUG-02** | Ineffective Backend Admin Auth Middleware | `backend/src/middleware/auth.middleware.ts` | **CRITICAL** | Security / Auth |
| **BUG-03** | Overly Permissive Anonymous UPDATE on Teams | `supabase/migrations/20261102_unified_setup.sql` | **HIGH** | Database / RLS |
| **BUG-04** | Missing Production Email Credentials (Simulated Mode) | `backend/.env` (`RESEND_API_KEY`, `SMTP_PASS`) | **MEDIUM** | Infrastructure |
| **BUG-05** | Ephemeral Disk Storage on Render Web Service | `backend/src/routes/upload.routes.ts` | **HIGH** | Architecture / File Storage |
| **BUG-06** | Dead / Abandoned Cashfree Payment Code | `backend/src/services/cashfree.ts` | **LOW** | Technical Debt |
| **BUG-07** | Hardcoded Marketing Dates vs Database Settings | `frontend/src/shared/data/apex.ts` | **MEDIUM** | Frontend / UX |
| **BUG-08** | Wildcard CORS Callback Permissiveness | `backend/src/server.ts` | **MEDIUM** | Security / Network |
| **BUG-09** | Vercel Multi-Service Rewrite Conflict | `vercel.json` | **LOW** | Deployment |

---

## Detailed Issue Analysis

### BUG-01: Unprotected Admin Dashboard (Direct Access)
- **Location:** [`frontend/src/components/admin/admin-shell.tsx:45`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/components/admin/admin-shell.tsx#L45), [`frontend/src/routes/admin.index.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/admin.index.tsx), [`frontend/src/routes/admin.registrations.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/admin.registrations.tsx).
- **Severity:** **CRITICAL**.
- **Description:** Navigating to `/admin` or `/admin/registrations` in any browser immediately renders the administrative control console without prompting for credentials, Supabase Auth login, or 2FA. The UI explicitly states: `ADMIN MODE (DIRECT ACCESS)`.
- **Root Cause:** No route loader guard, auth context check, or session redirect exists in `admin.index.tsx` or `admin.registrations.tsx`.
- **Impact:** Any unauthenticated visitor or competitor can inspect all registered teams, participant phone numbers, personal email addresses, colleges, payment IDs, and download private pitch presentations.
- **Recommended Fix:** Implement Supabase Auth email/password or Magic Link login with a TanStack Router `beforeLoad` check requiring `user_roles.role = 'admin'`.

---

### BUG-02: Ineffective Backend Admin Authentication Middleware
- **Location:** [`backend/src/middleware/auth.middleware.ts:6-19`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/middleware/auth.middleware.ts#L6-L19).
- **Severity:** **CRITICAL**.
- **Description:** The `authenticateAdmin` middleware contains:
  ```typescript
  export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      if (config.nodeEnv === "development") return next();
      return errorResponse(res, "Unauthorized: Missing Authorization header", 401);
    }
    // Token verification can be expanded for Supabase JWT
    next();
  }
  ```
- **Root Cause:** In production, sending `Authorization: Bearer fake_token` bypasses authentication completely because the middleware never verifies the JWT signature against Supabase JWT secret or public keys.
- **Impact:** Any attacker with knowledge of the endpoint can call `DELETE /api/admin/teams/:id` or modify registration records simply by including a dummy Authorization header.
- **Recommended Fix:** Use `supabase.auth.getUser(token)` to verify the JWT and assert that the user has an `'admin'` record in `public.user_roles`.

---

### BUG-03: Overly Permissive Anonymous UPDATE on Teams
- **Location:** [`supabase/migrations/20261102_unified_setup.sql:256-259`](file:///Users/akashlodhi/Desktop/Hack_website/supabase/migrations/20261102_unified_setup.sql#L256-L259).
- **Severity:** **HIGH**.
- **Description:** The RLS policy for `UPDATE` on `public.teams` is defined as:
  ```sql
  CREATE POLICY "Allow anon update teams" ON public.teams FOR UPDATE TO anon, authenticated USING (true);
  ```
- **Root Cause:** Configured to allow client-side patching during initial rapid prototyping.
- **Impact:** An attacker who inspects the frontend bundle can retrieve `VITE_SUPABASE_PUBLISHABLE_KEY` and call:
  ```javascript
  supabase.from('teams').update({ payment_status: 'paid', status: 'approved' }).eq('id', target_id);
  ```
  allowing free fraudulent registrations directly through the database.
- **Recommended Fix:** Execute `DROP POLICY "Allow anon update teams" ON public.teams;`. Team updates must only be performed by the backend using the service role key.

---

### BUG-04: Missing Production Email Credentials (Simulated Mode)
- **Location:** [`backend/.env:19, 24`](file:///Users/akashlodhi/Desktop/Hack_website/backend/.env#L19), [`backend/src/services/email.service.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/services/email.service.ts).
- **Severity:** **MEDIUM**.
- **Description:** `RESEND_API_KEY` and `SMTP_PASS` are currently empty in production environment files.
- **Impact:** When a user completes payment, the email dispatcher executes in simulated dev mode (`provider: "simulated"`), outputting logs to stdout without delivering actual confirmation emails to participants' inboxes.
- **Recommended Fix:** Generate a Gmail App Password for `lodhiakash286@gmail.com` or create a free Resend API key and populate `RESEND_API_KEY` or `SMTP_PASS` in the Render dashboard.

---

### BUG-05: Ephemeral Disk Storage on Render Web Service
- **Location:** [`backend/src/routes/upload.routes.ts:170-174`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/routes/upload.routes.ts#L170-L174).
- **Severity:** **HIGH**.
- **Description:** If Supabase Storage is paused, unreachable, or errors during upload, the backend falls back to `fs.writeFileSync(localFilePath, file.buffer)` in `uploads/submissions/`.
- **Root Cause:** Free-tier compute instances on Render have ephemeral disks. When Render restarts or redeploys the service, all files in `uploads/submissions/` are permanently wiped.
- **Impact:** If any team relies on the local fallback because Supabase experienced a momentary blip, their uploaded pitch presentation will be lost on the next server restart.
- **Recommended Fix:** Ensure all uploads strictly require Supabase Storage or a persistent S3/GCS bucket; if cloud upload fails, return a retryable 503 error instead of storing on ephemeral container disk.

---

### BUG-06: Dead / Abandoned Cashfree Payment Code
- **Location:** [`backend/src/services/cashfree.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/services/cashfree.ts), [`frontend/src/cashfree.d.ts`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/cashfree.d.ts).
- **Severity:** **LOW**.
- **Description:** Legacy integration code for Cashfree Payments remains in the codebase with unused environment variables (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`).
- **Recommended Fix:** Safely delete `cashfree.ts` and associated legacy migration references to keep codebase clean and reduce maintenance overhead.

---

### BUG-07: Hardcoded Marketing Dates vs Dynamic Event Settings
- **Location:** [`frontend/src/shared/data/apex.ts`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/shared/data/apex.ts), [`frontend/src/routes/admin.index.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/admin.index.tsx).
- **Severity:** **MEDIUM**.
- **Description:** The admin overview provides a form to update event dates, registration deadlines, and prize money in the `event_settings` table. However, all frontend public sections (`Hero`, `RoadmapSection`, `RulesSection`, `PrizesSection`) read static hardcoded values from `apex.ts` rather than fetching `event_settings` via TanStack Query.
- **Impact:** Changing the deadline in the Admin Panel has zero effect on the countdown timer or deadline displayed to public participants on the homepage.
- **Recommended Fix:** Wrap `useQuery(['event_settings'])` in a custom hook `useEventSettings()` and consume it across public marketing sections.
