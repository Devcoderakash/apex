# API Security Architecture & Verification Report

## Endpoint Security Audit

| Endpoint | Method | Auth Guard | Validation | Rate Limiting | Status |
|---|---|---|---|---|---|
| `/api/create-order` | POST | Public | Zod Schema | Express Parser | Verified (₹199 fixed server-side) |
| `/api/verify-payment` | POST | Public | Zod Schema | Timing-Safe HMAC | Verified (SHA256 signature) |
| `/api/upload/presentation` | POST | Public | Multer + Ext Check | 20MB ceiling | Verified (Supabase Cloud Storage) |
| `/api/grievance` | POST | Public | Zod Schema | Body sanitization | Verified (`GRV-XXXX` generated) |
| `/api/grievance/:id` | GET | Public | Param sanitization | Read-only lookup | Verified |
| `/api/privacy-requests` | POST | Public | Zod Schema | Body sanitization | Verified (`PRV-XXXX` generated) |
| `/api/privacy-requests/:id` | GET | Public | Param sanitization | Read-only lookup | Verified |
| `/api/admin/registrations` | GET | Bearer Key / JWT | Timing-Safe Auth | Protected | Verified (Requires Passkey) |
| `/api/admin/registrations/:id/signed-url` | GET | Bearer Key / JWT | Timing-Safe Auth | Protected | Verified (Signed S3 URLs) |

## Threat Protection Summary
- **Input Sanitization:** URL schemes restricted against `javascript:` and `data:` attacks.
- **Timing Attacks:** Admin key and HMAC signature verification use `crypto.timingSafeEqual` to prevent side-channel leaks.
- **Price Tampering:** Order amounts are hardcoded server-side (`REGISTRATION_FEE_PAISE = 19900`); client amounts are completely ignored.
