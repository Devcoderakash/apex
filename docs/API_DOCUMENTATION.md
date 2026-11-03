# APEX 1.0 — API Documentation & Catalog

This document provides a comprehensive reference of all API endpoints exposed by the APEX 1.0 backend service.

---

## Endpoint Summary Table

| Method | Endpoint | Purpose | Auth Required | Database Operation | Status |
|---|---|---|---|---|---|
| `GET` | `/` | Service identification & root meta | None | None | Active |
| `GET` | `/api/health` | Service health check | None | None | Active |
| `POST` | `/api/create-order` | Create Razorpay order & pending team | None | `INSERT INTO public.teams` | Active |
| `POST` | `/api/verify-payment` | Verify HMAC signature & confirm team | None | `UPDATE public.teams` | Active |
| `GET` | `/api/payment/order/:orderId` | Retrieve order status by Razorpay ID | None | `SELECT FROM public.teams` | Active |
| `POST` | `/api/payment/webhook` | Razorpay webhook callback listener | Razorpay Secret | `UPDATE public.teams` | Active |
| `GET` | `/api/registration/:id/status`| Check registration & payment status | None | `SELECT FROM public.teams` | Active |
| `GET` | `/api/registration/:id` | Get registration details | None | `SELECT FROM public.teams` | Active |
| `POST` | `/api/upload/ppt` | Upload presentation deck (PDF/PPT) | None | Cloud Storage / Local Disk | Active |
| `GET` | `/api/upload/file/:fileName` | Stream locally stored presentation | None | File system read | Active |
| `GET` | `/api/upload/signed-url` | Generate temporary signed download link | None | Cloud Storage signed URL | Active |
| `POST` | `/api/email/send-confirmation`| Trigger automated confirmation email | None | `INSERT INTO registration_emails`| Active |
| `GET` | `/api/email/status/:id` | Check email delivery log | None | `SELECT FROM registration_emails`| Active |
| `POST` | `/api/email/retry/:id` | Force retry email dispatch | None | `UPDATE registration_emails` | Active |
| `GET` | `/api/admin/registrations` | Fetch all teams & members | Admin (Incomplete check)| `SELECT * FROM teams` | Active |
| `GET` | `/api/admin/registrations/:id/ppt-url`| Get 1-hour signed PPT URL | Admin (Incomplete check)| Cloud Storage signed URL | Active |
| `POST` | `/api/admin/registrations/:id/send-email`| Manual email trigger from admin | Admin (Incomplete check)| Email dispatch | Active |
| `GET` | `/api/admin/stats` | Aggregate dashboard metrics | Admin (Incomplete check)| Aggregates on `teams` | Active |
| `PATCH`| `/api/admin/teams/:id/status` | Update team status | Admin (Incomplete check)| `UPDATE teams SET status` | Active |
| `PUT` | `/api/admin/teams/:id` | Update team record details | Admin (Incomplete check)| `UPDATE teams SET ...` | Active |
| `DELETE`| `/api/admin/teams/:id` | Delete team and cascade members | Admin (Incomplete check)| `DELETE FROM teams` | Active |
| `GET` | `/api/admin/settings` | Read event settings | Admin (Incomplete check)| `SELECT FROM event_settings` | Active |
| `POST` | `/api/admin/settings` | Update event settings | Admin (Incomplete check)| `UPDATE event_settings` | Active |

---

## Detailed Endpoint Specifications

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Headers:** None
- **Response:** `200 OK`
```json
{
  "status": "OK",
  "timestamp": "2026-11-03T11:28:56.880Z"
}
```

---

### 2. Create Registration Order
- **Endpoint:** `POST /api/create-order` (Also aliased at `/create-order`, `/api/payment/create-order`)
- **Headers:** `Content-Type: application/json`
- **Request Body (Team Registration):**
```json
{
  "team_name": "Cyber Sentinels",
  "leader_name": "Akash Lodhi",
  "email": "lodhiakash286@gmail.com",
  "phone": "+919876543210",
  "college": "LNCT Bhopal",
  "team_size": 3,
  "ppt_url": "submissions/17300000_pitch.pdf",
  "ppt_storage_path": "submissions/17300000_pitch.pdf",
  "ppt_file_name": "pitch.pdf",
  "ppt_file_type": "application/pdf",
  "ppt_file_size": 204800,
  "preferred_domain": "Cybersecurity & Web3",
  "github_url": "https://github.com/example/repo",
  "linkedin_url": "https://linkedin.com/in/example",
  "members": [
    { "full_name": "Rohan Verma", "position": 2 },
    { "full_name": "Priya Sharma", "position": 3 }
  ]
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "order_id": "order_TvgbjtK8gUhePB",
  "orderId": "order_TvgbjtK8gUhePB",
  "amount": 19900,
  "amountInRupees": 199,
  "currency": "INR",
  "key_id": "rzp_live_TvchK8AZD6BwEb",
  "keyId": "rzp_live_TvchK8AZD6BwEb",
  "teamId": "2e53606c-5d09-4a5a-84f8-54f32f679c0d",
  "playerId": "APEX-1001",
  "teamName": "Cyber Sentinels",
  "leaderName": "Akash Lodhi",
  "email": "lodhiakash286@gmail.com",
  "phone": "+919876543210"
}
```
- **Error Response (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "Validation error in registration fields",
  "details": {
    "email": { "_errors": ["Valid email required"] }
  }
}
```

---

### 3. Verify Payment
- **Endpoint:** `POST /api/verify-payment` (Also aliased at `/verify-payment`, `/api/payment/verify`)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "razorpay_order_id": "order_TvgbjtK8gUhePB",
  "razorpay_payment_id": "pay_Owy93821038",
  "razorpay_signature": "321868e740404b3da59bf548677c77c92b21c4b7891e9882a98f121d89bf2341",
  "teamId": "2e53606c-5d09-4a5a-84f8-54f32f679c0d"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "status": "paid",
  "order_id": "order_TvgbjtK8gUhePB",
  "payment_id": "pay_Owy93821038",
  "playerId": "APEX-1001",
  "teamName": "Cyber Sentinels",
  "message": "Payment verified and registration confirmed successfully"
}
```
- **Signature Failure (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "Payment verification failed: Invalid signature"
}
```

---

### 4. Upload Presentation Deck
- **Endpoint:** `POST /api/upload/ppt`
- **Content-Type:** `multipart/form-data`
- **Form Field:** `ppt` (File binary: `.pdf`, `.ppt`, `.pptx`, max 20MB)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "storagePath": "submissions/1793705000000_pitch_deck.pdf",
  "fileName": "pitch_deck.pdf",
  "size": 1845200,
  "mimeType": "application/pdf",
  "url": "https://uzhovtxpuqyrtnfzoyuz.supabase.co/storage/v1/object/sign/apex-presentations/submissions/1793705000000_pitch_deck.pdf?token=..."
}
```
- **Payload Too Large (`413 Payload Too Large`):**
```json
{
  "error": "File too large. Maximum size is 20MB."
}
```

---

### 5. Trigger Automated Confirmation Email
- **Endpoint:** `POST /api/email/send-confirmation`
- **Request Body:**
```json
{
  "orderId": "order_TvgbjtK8gUhePB",
  "playerId": "APEX-1001",
  "forceRetry": false
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "provider": "resend",
  "messageId": "msg_01H...",
  "recipient": "lodhiakash286@gmail.com",
  "playerId": "APEX-1001"
}
```

---

### 6. Admin Aggregate Metrics
- **Endpoint:** `GET /api/admin/stats`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalTeams": 24,
    "paidTeams": 18,
    "approvedTeams": 12,
    "pendingTeams": 10,
    "totalParticipants": 76
  }
}
```

---

### 7. Admin Temporary Signed PPT Download URL
- **Endpoint:** `GET /api/admin/registrations/:id/ppt-url`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://uzhovtxpuqyrtnfzoyuz.supabase.co/storage/v1/object/sign/apex-presentations/submissions/173000_deck.pdf?token=...",
    "fileName": "deck.pdf",
    "mimeType": "application/pdf",
    "expiresIn": 3600
  }
}
```
