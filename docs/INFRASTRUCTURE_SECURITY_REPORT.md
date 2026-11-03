# Infrastructure & DevOps Security Report

## Deployed Topology
1. **Frontend Edge:** Vercel Global Edge Network with automatic SSL/TLS termination, HTTP/2, and strict HSTS headers (`max-age=63072000`).
2. **Backend Application:** Render Container Service running Node.js in Singapore region, reverse-proxied behind Cloudflare DDoS protection.
3. **Database & Storage:** Supabase Cloud in AWS Mumbai region (`ap-south-1`) providing low latency to Indian participants.

## Environment Variables Separation
- No backend secrets (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`) are exposed to client bundles.
- Frontend builds only receive public-safe keys (`VITE_RAZORPAY_KEY_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
