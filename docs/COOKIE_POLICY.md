# Cookie & Local Storage Policy — APEX 1.0

## 1. Overview
The APEX 1.0 platform (`https://apexhack.online`) uses cookies and browser local storage strictly to ensure site functionality, state persistence, and administrative security.

## 2. Cookie Classification

| Category | Storage Medium | Purpose | Necessity |
|---|---|---|---|
| **Essential / Functional** | Session Storage / Local Storage | Form state recovery, dark/light theme persistence, and Razorpay checkout handshake | Strictly Necessary (Always Active) |
| **Administrative Security** | Session Storage (`apex_admin_token`) | Admin session authentication; automatically invalidated on browser close | Strictly Necessary (Admin Only) |
| **Preference & Consent** | Local Storage (`apex_cookie_consent`) | Stores the user's granular cookie choices pursuant to DPDP compliance | Functional (12-month duration) |
| **Analytics & Telemetry** | Local Storage / Session Cache | Anonymized error logging and submission diagnostic metrics | Optional (User Configurable) |

## 3. Controlling Cookie Preferences
Users can inspect, toggle, or clear all preferences at any time by navigating to `/cookies` or accessing their browser privacy settings.
