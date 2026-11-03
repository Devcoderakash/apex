# APEX 1.0 — Security Audit & Vulnerability Assessment

This security audit assesses the APEX 1.0 architecture against the **OWASP Top 10 Web Application Security Risks**.

---

## Security Posture Overview

```
Overall Security Grade: C+ (Moderate Risk)
- Payment Integrity:   A  (Excellent — Server-enforced amounts & timing-safe HMAC verification)
- Injection Defense:   A  (Excellent — Fully parameterized queries via Supabase client)
- File Upload Safety:  B+ (Good — Strict 20MB limit, double MIME/extension check)
- Data Privacy & PII:  D  (Poor — Public anon select on full teams table)
- Access Control:      F  (Failing — Unprotected /admin route & unverified admin JWTs)
```

---

## OWASP Top 10 Detailed Assessment

### A01: Broken Access Control — FAILED (High Risk)
1. **Unauthenticated Admin Console:**
   - Anyone navigating to `/admin` or `/admin/registrations` can view all team registrations, download submitted pitch presentations, update approval statuses, and delete teams.
   - **Remediation:** Enforce Supabase Auth middleware with strict role checking (`user_roles.role = 'admin'`).
2. **Database Over-Privilege via Public Anon Key:**
   - Policy `"Allow anon update teams"` allows any client with the anon public key to issue direct `UPDATE` queries.
   - **Remediation:** Remove anonymous update policies on `public.teams` immediately. All updates must flow through authenticated backend endpoints.

---

### A02: Cryptographic Failures — PASSED (Low Risk)
1. **Razorpay HMAC-SHA256 Validation:**
   - The backend validates the payment signature using `crypto.createHmac("sha256", KEY_SECRET)` combined with `crypto.timingSafeEqual`:
     ```typescript
     const expectedBuf = Buffer.from(expectedSignature, "utf-8");
     const actualBuf = Buffer.from(signature, "utf-8");
     return crypto.timingSafeEqual(expectedBuf, actualBuf);
     ```
   - This prevents timing side-channel attacks and ensures payment data cannot be fabricated.
2. **Secrets Management:**
   - Live Razorpay secrets (`fX0r3dpvwsA7vjFeLO3z6Trl`) and Supabase Service Role keys are stored exclusively in backend `.env` files and are never leaked to client bundles.

---

### A03: Injection — PASSED (Low Risk)
1. **SQL Injection:**
   - All queries interact with PostgreSQL through `@supabase/supabase-js`, which utilizes parameterized queries via PostgREST. No raw SQL concatenation exists in backend controllers.
2. **Command / Code Injection:**
   - File uploads sanitize file names:
     ```typescript
     const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
     ```
   - No `eval()`, `exec()`, or child process execution is present in user-facing request paths.

---

### A04: Insecure Design — PARTIALLY PASSED (Medium Risk)
1. **Authoritative Server Pricing:**
   - The registration fee (₹199 / 19900 paise) is enforced strictly on the server in `createOrder` ([`payment.controller.ts:123`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/controllers/payment.controller.ts#L123)), eliminating client-side price tampering.
2. **Missing Participant Authentication:**
   - Once registered, participants only have `/success?pid=...` to reference their confirmation. If they lose their link or browser tab, they have no login mechanism to retrieve their pass or update their submitted idea deck.

---

### A05: Security Misconfiguration — PARTIALLY PASSED (Medium Risk)
1. **CORS Configuration:**
   - [`backend/src/server.ts:25`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/server.ts#L25) falls back to `callback(null, true)` for unmatched origins in development. In production, `FRONTEND_URL` must be strictly enforced.
2. **Reverse Proxy Headers:**
   - `app.enable("trust proxy")` is correctly enabled, ensuring client IP resolution works accurately behind Vercel or Render reverse proxies.

---

### A06: Vulnerable and Outdated Components — PASSED (Low Risk)
- Standard libraries (Express 4.21, Multer 2.4, Razorpay 2.9, Supabase JS 2.115, React 19, Vite 8) are on modern, patched releases without known high/critical CVEs.

---

### A07: Identification & Authentication Failures — FAILED (High Risk)
- The admin endpoint [`authenticateAdmin`](file:///Users/akashlodhi/Desktop/Hack_website/backend/src/middleware/auth.middleware.ts#L6) does not decode or cryptographically verify JWT tokens. Any non-empty string in the `Authorization` header satisfies the check in production.

---

### A08: Software and Data Integrity Failures — PASSED (Low Risk)
- **File Upload Guard:** Strict validation on file size (20MB max), MIME type (`application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`), and file extension (`.pdf`, `.ppt`, `.pptx`).

---

### A09: Security Logging & Monitoring — PASSED (Low Risk)
- Payment controller safely catches Razorpay errors and redacts sensitive credentials:
  ```typescript
  const safeErrorLog = {
    statusCode: apiErr.statusCode || apiErr.status,
    code: apiErr.error?.code,
    description: apiErr.error?.description,
    source: apiErr.error?.source,
    step: apiErr.error?.step,
    reason: apiErr.error?.reason,
    field: apiErr.error?.field,
  };
  ```
- All email dispatch attempts are permanently logged with status and provider IDs in `public.registration_emails`.

---

## Actionable Security Hardening Checklist

- [ ] **Action 1:** Implement password/magic-link authentication on `/admin` using Supabase Auth.
- [ ] **Action 2:** Update `authenticateAdmin` in `backend/src/middleware/auth.middleware.ts` to call `supabase.auth.getUser(token)` and verify admin role in `user_roles`.
- [ ] **Action 3:** Revoke `Allow anon update teams` in Supabase SQL editor (`DROP POLICY "Allow anon update teams" ON public.teams;`).
- [ ] **Action 4:** Restrict `Allow anon select from teams` to allow reading only by explicit matching `player_id` or `razorpay_order_id`.
- [ ] **Action 5:** Replace Render local disk fallback with strict cloud storage upload error handling.
