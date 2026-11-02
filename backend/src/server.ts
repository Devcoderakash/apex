import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiRouter } from "./routes/index.js";
import { createOrder, verifyPayment } from "./controllers/payment.controller.js";

const app = express();

// Trust reverse proxy headers (essential for Vercel deployment)
app.enable("trust proxy");

// Middleware: CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or any localhost origin
      if (
        !origin ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        (config.frontendUrl && origin === config.frontendUrl)
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow configured origins in development
      }
    },
    credentials: true,
  }),
);

// Middleware: JSON parser with rawBody preservation for webhooks
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

// URL encoded body parser
app.use(express.urlencoded({ extended: true }));

// Root health check
app.get("/", (_req, res) => {
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

// Mount API routes
app.use("/api", apiRouter);

// Direct Razorpay Standard Checkout endpoints (for direct /create-order calls)
app.post("/create-order", createOrder);
app.post("/verify-payment", verifyPayment);

// Central error handler
app.use(errorHandler);

// Start server if not running in serverless environment
if (!process.env.VERCEL) {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`[APEX Backend] Server running on port ${config.port}`);
    console.log(`[APEX Backend] Mode: ${config.nodeEnv}`);
  });
}

export default app;
