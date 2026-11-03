# APEX 1.0 — Complete Feature Inventory & Verification Matrix

All features across frontend, backend, database, and integrations have been cataloged and verified below.

| Feature ID | Feature Name | Layer | Description | Status | Verification Evidence |
|---|---|---|---|---|---|
| **FEAT-01** | Landing & Hero Section | Frontend | Interactive UI with countdown timer, glitch typography, and registration CTA | Fully Completed | `src/routes/index.tsx` |
| **FEAT-02** | Registration & Team Entry | Full-Stack | 1–4 member team registration with dynamic slots and input validation | Fully Completed | `src/routes/register.tsx` |
| **FEAT-03** | Presentation File Upload | Full-Stack | PPT/PDF upload to Supabase Storage (`apex-presentations`) with 20MB cap | Fully Completed | `uploadPptFile()` |
| **FEAT-04** | Razorpay Live Checkout | Full-Stack | Server-side order creation (₹199) and client-side Razorpay standard modal | Fully Completed | Verified live: `order_TviaZ0YMzSZmgh` |
| **FEAT-05** | HMAC Signature Verification | Backend | Timing-safe verification using `crypto.timingSafeEqual` | Fully Completed | `backend/src/services/razorpay.service.ts` |
| **FEAT-06** | Digital Pass & Success Route | Frontend | Displays confirmed team pass, QR code payload, and payment receipt | Fully Completed | `src/routes/success.tsx` |
| **FEAT-07** | Automated Email Dispatch | Backend | Nodemailer / Resend confirmation pipeline with database audit logging | Fully Completed | `backend/src/services/email.service.ts` |
| **FEAT-08** | Admin Dashboard & Auth | Full-Stack | Administrative lock/login card with passkey check and team roster stats | Fully Completed | `src/components/admin/admin-shell.tsx` |
| **FEAT-09** | Presentation Secure Download | Backend | Authenticated signed URL generator for team pitch decks | Fully Completed | `backend/src/controllers/admin.controller.ts` |
| **FEAT-10** | DPDP Cookie Consent Banner | Frontend | Granular cookie preferences with local storage persistence | Fully Completed | `src/components/site/cookie-consent-banner.tsx` |
| **FEAT-11** | Official Rules & Regulations | Frontend | 14 authoritative sections for hackathon participation | Fully Completed | `src/routes/rules.tsx` |
| **FEAT-12** | Terms & Conditions | Frontend | 15 comprehensive legal sections | Fully Completed | `src/routes/terms.tsx` |
| **FEAT-13** | Privacy Policy | Frontend | 13 DPDP Act 2023 compliant sections | Fully Completed | `src/routes/privacy.tsx` |
| **FEAT-14** | Grievance Redressal Portal | Full-Stack | DPDP Section 13 complaint submission (`GRV-XXXX`) and ticket tracking | Fully Completed | `src/routes/grievance.tsx` |
| **FEAT-15** | Data Principal Rights Portal | Full-Stack | Access, Correction, and Erasure portal (`PRV-XXXX`) | Fully Completed | `src/routes/privacy-requests.tsx` |
| **FEAT-16** | Refund & Cancellation Policy | Frontend | Organizer-approved refund guidelines and dispute handling | Fully Completed | `src/routes/refunds.tsx` |
