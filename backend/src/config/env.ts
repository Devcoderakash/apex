import dotenv from "dotenv";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "",
  },
  cashfree: {
    appId: process.env.CASHFREE_APP_ID || "",
    secretKey: process.env.CASHFREE_SECRET_KEY || "",
    environment: (process.env.CASHFREE_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    apiVersion: "2023-08-01",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },
  adminApiKey: process.env.ADMIN_API_KEY || "apex_admin_secret_2026",
  cronSecret: process.env.CRON_SECRET || "",
  email: {
    senderName: process.env.EMAIL_SENDER_NAME || "APEX//1.0 Team",
    senderEmail: process.env.EMAIL_SENDER_EMAIL || "lodhiakash286@gmail.com",
    replyTo: process.env.EMAIL_REPLY_TO || "lodhiakash286@gmail.com",
    resendApiKey: process.env.RESEND_API_KEY || "",
    smtp: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false",
      user: process.env.SMTP_USER || process.env.EMAIL_SENDER_EMAIL || "lodhiakash286@gmail.com",
      pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "",
    },
  },
};
