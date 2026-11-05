import crypto from "node:crypto";
import Razorpay from "razorpay";
import { config } from "../config/env.js";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  const keyId = config.razorpay.keyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = config.razorpay.keySecret || process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret) {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    return razorpayInstance;
  }
  return null;
}

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  if (!params.amountPaise || params.amountPaise < 100) {
    const err: any = new Error("Amount must be at least 100 paise (₹1.00)");
    err.statusCode = 400;
    throw err;
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    const err: any = new Error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.",
    );
    err.statusCode = 500;
    throw err;
  }

  const orderOptions = {
    amount: Math.round(params.amountPaise),
    currency: params.currency || "INR",
    receipt: params.receipt || `rcpt_${Date.now()}`,
    notes: params.notes || {},
  };

  try {
    const order = await razorpay.orders.create(orderOptions);
    const keyId = config.razorpay.keyId || process.env.RAZORPAY_KEY_ID;
    const mode = keyId?.startsWith("rzp_live_") ? "LIVE" : "TEST";
    console.log(`[Razorpay Service] Order created: ${order.id} | Mode: ${mode} | Amount: ₹${Number(order.amount) / 100} | Key: ${keyId?.slice(0, 8)}...`);
    return order;
  } catch (apiErr: any) {
    // Safely log the exact Razorpay API error response without exposing keys or secrets
    const safeErrorLog = {
      statusCode: apiErr.statusCode || apiErr.status,
      code: apiErr.error?.code,
      description: apiErr.error?.description,
      source: apiErr.error?.source,
      step: apiErr.error?.step,
      reason: apiErr.error?.reason,
      field: apiErr.error?.field,
    };
    console.error("[Razorpay API Error Response]", JSON.stringify(safeErrorLog, null, 2));
    const isAuthError =
      apiErr.statusCode === 401 ||
      apiErr.status === 401 ||
      apiErr.error?.code === "AUTHENTICATION_ERROR" ||
      (apiErr.error?.code === "BAD_REQUEST_ERROR" &&
        (apiErr.error?.description?.toLowerCase().includes("auth") ||
          apiErr.error?.description?.toLowerCase().includes("key") ||
          apiErr.error?.description?.toLowerCase().includes("secret")));

    const statusCode = isAuthError ? 401 : 500;

    const message =
      apiErr.error?.description ||
      apiErr.message ||
      "Failed to create Razorpay order";

    const err: any = new Error(message);
    err.statusCode = statusCode;
    err.details = apiErr.error;
    throw err;
  }
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = config.razorpay.keySecret;
  if (!secret) {
    console.error("[Razorpay Service] RAZORPAY_KEY_SECRET missing in environment.");
    return false;
  }

  if (!params.orderId || !params.paymentId || !params.signature) {
    console.error("[Razorpay Service] Missing required fields for signature verification.");
    return false;
  }

  try {
    const payload = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(params.signature, "utf-8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Razorpay Service] Error verifying signature:", err);
    return false;
  }
}

/**
 * Fetch authoritative payment details directly from Razorpay API.
 */
export async function fetchRazorpayPayment(paymentId: string) {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new Error("Razorpay client is not configured");
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (err: any) {
    console.error(`[Razorpay Service] Failed to fetch payment ${paymentId}:`, err?.message);
    throw err;
  }
}

/**
 * Timing-safe HMAC-SHA256 verification for Razorpay Webhooks.
 * Strictly rejects missing signatures or secret mismatches.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  customSecret?: string
): boolean {
  const secret = customSecret || config.razorpay.webhookSecret || config.razorpay.keySecret;
  if (!secret || !signature || !rawBody) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Razorpay Service] Webhook signature verification error:", err);
    return false;
  }
}
