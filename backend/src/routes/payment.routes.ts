import { Router } from "express";
import {
  createOrder,
  getOrder,
  handleWebhook,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { memoryUpload } from "../middleware/upload.middleware.js";

export const paymentRouter = Router();

// Payment & Checkout endpoints
paymentRouter.post("/create-order", createOrder);
paymentRouter.post("/verify", memoryUpload, verifyPayment);
paymentRouter.post("/verify-payment", memoryUpload, verifyPayment);
paymentRouter.get("/order/:orderId", getOrder);
paymentRouter.post("/webhook", handleWebhook);
