# Admin Panel Security & Authorization Report

## Control Console Architecture
- **Routes:** `/admin` and `/admin/registrations`
- **Interface:** `AdminShell` component (`frontend/src/components/admin/admin-shell.tsx`)
- **Access Control:** Gated by an administrative passkey modal. Sessions are stored in `sessionStorage` and sent via `Authorization: Bearer <key>` headers.
- **Server Verification:**
  `authenticateAdmin` middleware hashes incoming bearer tokens with SHA-256 and validates against `ADMIN_API_KEY` using `crypto.timingSafeEqual`.
- **Privilege Separation:**
  Public users cannot access presentation download URLs. Signed URLs with short expiration windows are only issued by authenticated admin endpoints.
