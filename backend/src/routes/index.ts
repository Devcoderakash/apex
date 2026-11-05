import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { registrationRouter } from "./registration.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { emailRouter } from "./email.routes.js";
import { grievanceRouter, privacyRouter } from "./compliance.routes.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";
import { memoryUpload } from "../middleware/upload.middleware.js";

export const apiRouter = Router();

// Root API info
apiRouter.get("/", (_req, res) => {
  res.json({
    name: "APEX 1.0 Backend API",
    status: "online",
    endpoints: {
      health: "/api/health",
      payment: "/api/payment",
      registration: "/api/registration",
      admin: "/api/admin",
    },
  });
});

// Health check
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Direct Razorpay Standard Checkout endpoints
apiRouter.post("/create-order", createOrder);
apiRouter.post("/verify-payment", memoryUpload, verifyPayment);

// Payments
apiRouter.use("/payment", paymentRouter);
apiRouter.use("/payments", paymentRouter);

// Registrations
apiRouter.use("/registration", registrationRouter);
apiRouter.use("/registrations", registrationRouter);

// Admin
apiRouter.use("/admin", adminRouter);

// Uploads
apiRouter.use("/upload", uploadRouter);

// Automated Confirmation Emails
apiRouter.use("/email", emailRouter);
apiRouter.use("/emails", emailRouter);

// DPDP Compliance: Grievances & Privacy Requests
apiRouter.use("/grievance", grievanceRouter);
apiRouter.use("/grievances", grievanceRouter);
apiRouter.use("/privacy-requests", privacyRouter);


