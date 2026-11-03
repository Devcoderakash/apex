# APEX 1.0 — Complete Feature Inventory

This document provides a comprehensive inventory of all features currently discovered across the frontend, backend, database, and third-party integrations of the APEX 1.0 codebase.

---

## Feature Categorization Summary

| Category | Count | Description |
|---|---|---|
| **A. Fully Completed** | 12 | Tested, functionally verified, database/API connected |
| **B. Partially Completed** | 3 | Core functional code exists, but relies on fallbacks or missing configs |
| **C. UI Only / Dummy** | 3 | Frontend components rendered with static mock data; no interactive backend |
| **D. Broken / Security Risks** | 2 | Functional defects or severe authorization vulnerabilities requiring immediate fix |
| **E. Not Implemented** | 3 | Planned concepts present in copy/docs but no code implementation |
| **F. Deprecated / Legacy** | 1 | Abandoned in favor of newer services |

---

## Detailed Feature Matrix

### Category A: Fully Completed Features

#### 1. Landing Page Showcase & Marketing Experience
- **Purpose:** Public portal presenting event identity, tagline ("One Idea. No Limits."), timeline, judging criteria, and sponsor tiers.
- **Access:** Public (All visitors).
- **Frontend:** [`frontend/src/routes/index.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/index.tsx), [`apex-sections.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/components/sections/apex-sections.tsx), [`cinematic-hero-background.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/components/sections/cinematic-hero-background.tsx).
- **Backend/DB:** Purely client-side rendering with animated canvas stars, Framer Motion reveals, and TanStack Router navigation.
- **Working Status:** **Operational (100%)**.

#### 2. Rules & Judging Protocol Page (`/rules`)
- **Purpose:** Detail the 8 official competition rules and visual weightage breakdown of the 4 judging criteria (Innovation 30%, Execution 30%, Impact 20%, Presentation 20%).
- **Access:** Public.
- **Frontend:** [`frontend/src/routes/rules.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/rules.tsx), dynamic progress bars and responsive cards.
- **Working Status:** **Operational (100%)**.

#### 3. Rewards & Prize Structure Page (`/prizes`)
- **Purpose:** Showcase the ₹30,000 cash prize pool breakdown (Champion ₹18,000, Runner Up ₹8,000, 2nd Runner Up ₹4,000) and 6 special achievement tracks.
- **Access:** Public.
- **Frontend:** [`frontend/src/routes/prizes.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/prizes.tsx).
- **Working Status:** **Operational (100%)**.

#### 4. Frequently Asked Questions (`/faq`)
- **Purpose:** Address queries on eligibility, AI tool usage, 1–4 member team structures, and Bhopal offline venue details. Includes structured SEO JSON-LD schema (`FAQPage`).
- **Access:** Public.
- **Frontend:** [`frontend/src/routes/faq.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/faq.tsx).
- **Working Status:** **Operational (100%)**.

#### 5. Legal & Compliance Pages (`/terms`, `/privacy`)
- **Purpose:** Display Terms of Participation, code of conduct, intellectual property rights, refund policies, and data privacy notices.
- **Access:** Public.
- **Frontend:** [`frontend/src/routes/terms.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/terms.tsx), [`frontend/src/routes/privacy.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/privacy.tsx).
- **Working Status:** **Operational (100%)**.

#### 6. Dynamic Team Registration Form
- **Purpose:** Collect leader info (name, email, phone, college), dynamic team size selector (1 to 4 members), and optional domain/GitHub/LinkedIn URLs.
- **Access:** Public.
- **Frontend:** [`frontend/src/routes/register.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/register.tsx) with React Hook Form + Zod schema validation (`superRefine` enforces required member fields dynamically based on `team_size`).
- **Working Status:** **Operational (100%)**.

#### 7. Presentation Deck Upload (Cloud + Local Resilient Fallback)
- **Purpose:** Upload idea presentation in PDF, PPT, or PPTX format up to 20MB.
- **Access:** Public during registration.
- **Frontend:** [`frontend/src/lib/api.ts`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/lib/api.ts) (`uploadPptFile`).
- **Backend:** [`backend/src/routes/upload.routes.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/routes/upload.routes.ts) with Multer memory storage streaming to Supabase Storage (`apex-presentations`) and fallback to local disk storage (`uploads/submissions/`).
- **Working Status:** **Operational (100%)**.

#### 8. Razorpay Live Order Creation (`/api/create-order`)
- **Purpose:** Server-side creation of Razorpay payment orders for ₹199 (19900 paise). Prevents client-side price tampering.
- **Access:** Backend API called by registration flow.
- **Backend:** [`backend/src/controllers/payment.controller.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/controllers/payment.controller.ts), [`backend/src/services/razorpay.service.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/services/razorpay.service.ts).
- **Working Status:** **Operational (100%)** — Verified in Razorpay Live Mode with key `rzp_live_TvchK8AZD6BwEb`.

#### 9. Cryptographic Payment Verification (`/api/verify-payment`)
- **Purpose:** Verifies Razorpay HMAC-SHA256 signature (`order_id + "|" + payment_id`, secret) with timing-safe comparison. Updates `payment_status` to `'paid'` and sets `paid_at = now()`.
- **Backend:** [`backend/src/controllers/payment.controller.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/controllers/payment.controller.ts) (`verifyPayment`).
- **Working Status:** **Operational (100%)**.

#### 10. Registration Success & Access Pass (`/success`)
- **Purpose:** Displays official cyber-styled Access Pass, Team ID badge (`APEX-XXXX`), payment receipt reference, one-click copy buttons, and "Add to Calendar" ICS generator.
- **Access:** Registered participants.
- **Frontend:** [`frontend/src/routes/success.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/success.tsx).
- **Working Status:** **Operational (100%)**.

#### 11. Admin Registration Manager (`/admin/registrations`)
- **Purpose:** Search and filter registrations by team name, leader, email, college, status (Pending/Approved/Rejected), and payment status.
- **Access:** Admin.
- **Frontend:** [`frontend/src/routes/admin.registrations.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/admin.registrations.tsx).
- **Backend:** `GET /api/admin/registrations`, `PATCH /api/admin/teams/:id/status`, `PUT /api/admin/teams/:id`, `DELETE /api/admin/teams/:id`.
- **Working Status:** **Operational (100%)**.

#### 12. Admin 1-Hour Signed PPT Access (`/api/admin/registrations/:id/ppt-url`)
- **Purpose:** Generates a secure, temporary 1-hour signed URL from Supabase Storage allowing organizers to download and inspect private pitch decks.
- **Backend:** [`backend/src/controllers/admin.controller.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/controllers/admin.controller.ts) (`getTeamPptSignedUrl`).
- **Working Status:** **Operational (100%)**.

---

### Category B: Partially Completed Features

#### 13. Automated Confirmation Email System
- **Purpose:** Send branded HTML confirmation email with team pass, event dates, and instructions upon payment verification.
- **Status:** **Partially Completed (75%)**.
- **Implementation:** Complete, responsive HTML template with inline styling in [`email-template.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/services/email-template.ts). Dual-provider support (Resend SDK + Nodemailer SMTP). Deduplication cache in memory and `registration_emails` table.
- **Limitation:** In the current environment, `RESEND_API_KEY` and `SMTP_PASS` are blank. The system automatically falls back to simulated/dev mode logging in console rather than delivering actual inbox mail.

#### 14. Admin Event Settings Panel (`/admin`)
- **Purpose:** View and update registration deadlines, prize pool figures, and organizer contact details dynamically.
- **Status:** **Partially Completed (60%)**.
- **Implementation:** Form in [`frontend/src/routes/admin.index.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/routes/admin.index.tsx) connects to `event_settings` table.
- **Limitation:** The marketing frontend (`frontend/src/shared/data/apex.ts`) does not read from `event_settings` dynamically; marketing copy remains hardcoded in static constants.

#### 15. Real-Time Registration Analytics Bar Chart
- **Purpose:** Visualize team registrations categorized by domain in a Recharts bar chart on `/admin`.
- **Status:** **Partially Completed (70%)**.
- **Implementation:** Chart renders domain distributions.
- **Limitation:** If teams submit custom preferred domains not in the standard list, chart groupings can become uneven.

---

### Category C: UI Only / Dummy Features

#### 16. Sponsor Tier Cards
- **Purpose:** Display sponsor slots for Title, Gold, Tech, and Community sponsors.
- **Status:** **UI Only (30%)**.
- **Implementation:** Displayed in [`sponsors-section.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/components/sections/sponsors-section.tsx).
- **Limitation:** No company logos or external links are attached. It currently displays empty slot placeholders ("SLOT 01 AVAILABLE", "INQUIRE FOR SPONSORSHIP").

#### 17. Organizer Leadership Profile Avatars
- **Purpose:** Showcase the core leadership committee (Hackathon Director, Tech Lead, Ops Lead).
- **Status:** **UI Only (40%)**.
- **Implementation:** Initials badges (AV, RI, SK, MR, TG) rendered from [`apex.ts`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/shared/data/apex.ts).
- **Limitation:** No real member photos, bios, LinkedIn URLs, or contact links.

#### 18. Manual Email Resend Button in Admin Table
- **Purpose:** Resend confirmation email to a specific team from the admin table.
- **Status:** **UI Dummy / Partial (50%)**.
- **Implementation:** Button triggers `POST /api/admin/registrations/:id/send-email`.
- **Limitation:** Due to unconfigured SMTP/Resend API keys in production, this triggers the simulated logging fallback without delivering real mail.

---

### Category D: Broken / Critical Security Vulnerabilities

#### 19. Unprotected Admin Dashboard Route (`/admin`)
- **Status:** **CRITICAL VULNERABILITY (Broken Access Control)**.
- **Location:** [`frontend/src/components/admin/admin-shell.tsx`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/components/admin/admin-shell.tsx) & [`backend/src/middleware/auth.middleware.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/middleware/auth.middleware.ts).
- **Finding:** The admin frontend is completely unprotected. Any visitor navigating to `/admin` or `/admin/registrations` is granted direct access without login, password prompt, or session token.
- **Backend Finding:** `authenticateAdmin` in `backend/src/middleware/auth.middleware.ts` skips authentication in development mode, and in production merely checks `if (!authHeader) return 401; next();` without verifying the signature or claims of the JWT token.
- **Impact:** Anyone can view participant emails, phone numbers, download pitch decks, edit team information, or delete teams.

#### 20. Permissive Anonymous Supabase RLS on `teams` Table
- **Status:** **HIGH VULNERABILITY**.
- **Location:** Supabase migration [`20261102_unified_setup.sql`](file:///Users/akashlodhi/Desktop/Hack_website/supabase/migrations/20261102_unified_setup.sql).
- **Finding:** RLS policy `"Allow anon update teams"` allows unauthenticated users (`anon`) to execute `UPDATE` operations on `public.teams` where `USING (true)`.
- **Impact:** A malicious client using the public Supabase publishable key could directly execute updates against team records.

---

### Category E: Not Implemented Features

#### 21. Round 2 Offline Scoring & Live Leaderboard
- **Purpose:** Real-time scoring portal for judges during the Bhopal offline finale.
- **Status:** **Not Implemented (0%)**. No database schema or frontend route exists for live scoring.

#### 22. Participant Account / Login Dashboard
- **Purpose:** Allow team leaders to log back in after registration to update their PPT deck or edit member details.
- **Status:** **Not Implemented (0%)**. Once registered, participants only have `/success?pid=...` and cannot re-authenticate into a personal profile.

#### 23. Automated SMS / WhatsApp Updates
- **Purpose:** SMS or WhatsApp notifications for payment confirmation or shortlisting alerts.
- **Status:** **Not Implemented (0%)**.

---

### Category F: Deprecated / Legacy Features

#### 24. Cashfree Payment Gateway Integration
- **Location:** [`backend/src/services/cashfree.ts`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/services/cashfree.ts), [`frontend/src/cashfree.d.ts`](file:///Users/akashlodhi/Desktop/Hack_website/frontend/src/cashfree.d.ts).
- **Status:** **Deprecated / Dead Code**.
- **Finding:** Cashfree PG was the original payment system before transitioning to Razorpay. It is not loaded in `frontend/src/routes/register.tsx` and can be safely archived.
