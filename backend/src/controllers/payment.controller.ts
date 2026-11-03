import crypto from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config/env.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../services/razorpay.service.js";
import {
  attachRazorpayOrder,
  createPendingRegistration,
  getTeamByOrderId,
  markTeamFailed,
  markTeamPaid,
  REGISTRATION_FEE_INR,
  REGISTRATION_FEE_PAISE,
} from "../services/registration.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

const registrationSchema = z.object({
  team_name: z.string().trim().min(2, "Team name is required"),
  leader_name: z.string().trim().min(2, "Leader name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  college: z.string().optional().default(""),
  team_size: z.coerce.number().min(1).max(5).default(2),
  ppt_url: z.string().optional().default(""),
  ppt_storage_path: z.string().optional(),
  ppt_file_name: z.string().optional(),
  ppt_file_type: z.string().optional(),
  ppt_file_size: z.coerce.number().optional(),
  preferred_domain: z.string().optional(),
  github_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  project_title: z.string().optional(),
  project_description: z.string().optional(),
  problem_statement: z.string().optional(),
  proposed_solution: z.string().optional(),
  tech_stack: z.string().optional(),
  expected_impact: z.string().optional(),
  demo_url: z.string().optional(),
  portfolio_url: z.string().optional(),
  other_links: z.string().optional(),
  consent_service: z.boolean().optional().default(true),
  consent_marketing_email: z.boolean().optional().default(false),
  consent_marketing_sms: z.boolean().optional().default(false),
  consent_marketing_whatsapp: z.boolean().optional().default(false),
  members: z
    .array(
      z.object({
        full_name: z.string().min(1),
        position: z.number().default(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        college: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  teamId: z.string().optional(),
});

const standardOrderSchema = z.object({
  amount: z.coerce.number().min(100, "Amount must be at least 100 paise (₹1.00)"),
  currency: z.string().default("INR"),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

/**
 * POST /api/create-order, POST /api/payments/create-order, POST /api/payment/create-order
 * Validates order amount (>= 100 paise) and creates a server-side Razorpay order
 */
export async function createOrder(req: Request, res: Response) {
  try {
    // 1. If standard amount payload is provided (generic / standard checkout)
    if (req.body.amount !== undefined) {
      const parseResult = standardOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation error: amount must be at least 100 paise (₹1.00)",
          details: parseResult.error.format(),
        });
      }

      const { amount, currency, receipt, notes } = parseResult.data;
      const order = await createRazorpayOrder({
        amountPaise: amount,
        currency,
        receipt,
        notes,
      });

      return res.status(200).json({
        success: true,
        order_id: order.id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
        keyId: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
      });
    }

    // 2. If team registration payload is provided
    if (req.body.team_name !== undefined) {
      const parseResult = registrationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation error in registration fields",
          details: parseResult.error.format(),
        });
      }

      const payload = parseResult.data;

      // Create or retrieve pending record in Supabase
      const { teamId, playerId, cleanId } = await createPendingRegistration({
        ...payload,
        ppt_storage_path: payload.ppt_storage_path,
        ppt_file_name: payload.ppt_file_name,
        ppt_file_type: payload.ppt_file_type,
        ppt_file_size: payload.ppt_file_size,
      });

      // Generate Razorpay order on server (₹199 = 19900 paise)
      const receipt = `rcpt_${cleanId.slice(0, 10)}_${Date.now().toString().slice(-4)}`;
      const rzpOrder = await createRazorpayOrder({
        amountPaise: REGISTRATION_FEE_PAISE,
        currency: "INR",
        receipt,
        notes: {
          team_id: teamId,
          player_id: playerId,
          team_name: payload.team_name,
          leader_name: payload.leader_name,
          email: payload.email,
        },
      });

      const razorpayOrderId = rzpOrder.id;
      await attachRazorpayOrder(teamId, razorpayOrderId);

      console.log(
        `[Payment Controller] Created Razorpay order ${razorpayOrderId} for Team ${payload.team_name} (Amount: ₹${REGISTRATION_FEE_INR})`,
      );

      return res.status(200).json({
        success: true,
        order_id: razorpayOrderId,
        orderId: razorpayOrderId,
        amount: REGISTRATION_FEE_PAISE,
        amountInRupees: REGISTRATION_FEE_INR,
        currency: "INR",
        key_id: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
        keyId: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
        teamId,
        playerId,
        teamName: payload.team_name,
        leaderName: payload.leader_name,
        email: payload.email,
        phone: payload.phone,
      });
    }

    return res.status(400).json({
      success: false,
      error: "Missing required parameters: provide either 'amount' (minimum 100 paise) or team registration fields.",
    });
  } catch (err: any) {
    console.error("[Payment Controller] createOrder Error:", err);
    const statusCode = err.statusCode || (err.message?.includes("credentials") ? 500 : 500);
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to create payment order",
    });
  }
}

/**
 * POST /api/verify-payment, POST /api/payments/verify, POST /api/payment/verify
 * Cryptographically verifies Razorpay HMAC-SHA256 signature
 */
export async function verifyPayment(req: Request, res: Response) {
  try {
    const orderId =
      req.body.razorpay_order_id ||
      req.body.order_id ||
      req.body.orderId;
    const paymentId =
      req.body.razorpay_payment_id ||
      req.body.payment_id ||
      req.body.paymentId;
    const signature =
      req.body.razorpay_signature ||
      req.body.signature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required verification fields. order_id, payment_id, and signature are required.",
        missing: {
          order_id: !orderId,
          payment_id: !paymentId,
          signature: !signature,
        },
      });
    }

    // Secure HMAC-SHA256 signature verification: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      console.warn(`[Payment Controller] Signature verification failed for order ${orderId}`);
      await markTeamFailed(orderId).catch(() => {});
      return res.status(400).json({
        success: false,
        error: "Payment verification failed: Invalid signature",
      });
    }

    // Check if linked to team registration in database
    const team = await getTeamByOrderId(orderId).catch(() => null);
    if (team) {
      if (team.payment_status === "paid") {
        return res.status(200).json({
          success: true,
          status: "paid",
          alreadyProcessed: true,
          order_id: orderId,
          payment_id: paymentId,
          playerId: team.player_id,
          teamName: team.team_name,
        });
      }

      await markTeamPaid(orderId, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      });

      sendRegistrationConfirmationEmail(team.id || orderId).catch((emailErr) => {
        console.warn("[Payment Controller] Confirmation email trigger notice:", emailErr.message);
      });

      return res.status(200).json({
        success: true,
        status: "paid",
        order_id: orderId,
        payment_id: paymentId,
        playerId: team.player_id,
        teamName: team.team_name,
        message: "Payment verified and registration confirmed successfully",
      });
    }

    // Generic order verification (standalone checkout)
    return res.status(200).json({
      success: true,
      status: "paid",
      order_id: orderId,
      payment_id: paymentId,
      message: "Payment verified successfully",
    });
  } catch (err: any) {
    console.error("[Payment Controller] verifyPayment Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to verify payment",
    });
  }
}

/**
 * GET /api/payment/order/:orderId or GET /api/payments/order/:orderId
 */
export async function getOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(res, "orderId parameter is required", 400);
    }

    const team = await getTeamByOrderId(orderId);
    if (!team) {
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, {
      id: team.id,
      player_id: team.player_id,
      team_name: team.team_name,
      payment_status: team.payment_status,
      payment_amount: team.payment_amount,
      status: team.status,
      paid_at: team.paid_at,
    });
  } catch (err: any) {
    console.error("[Payment Controller] getOrder Error:", err);
    return errorResponse(res, err.message || "Failed to retrieve order", 500);
  }
}

/**
 * GET /api/registrations/:id/status
 */
export async function getRegistrationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, "id parameter is required", 400);
    }

    const team = await getTeamByOrderId(id);
    if (!team) {
      return errorResponse(res, "Registration not found", 404);
    }

    return successResponse(res, {
      id: team.id,
      player_id: team.player_id,
      team_name: team.team_name,
      payment_status: team.payment_status,
      status: team.status,
      paid_at: team.paid_at,
    });
  } catch (err: any) {
    console.error("[Payment Controller] getRegistrationStatus Error:", err);
    return errorResponse(res, err.message || "Failed to retrieve status", 500);
  }
}

/**
 * POST /api/payments/webhook
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const secret = config.razorpay.keySecret;

    if (secret && signature) {
      const body = (req as any).rawBody || JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        console.warn("[Razorpay Webhook] Invalid webhook signature");
        return errorResponse(res, "Invalid webhook signature", 400);
      }
    }

    const event = req.body;
    const eventName = event?.event;

    if (eventName === "order.paid" || eventName === "payment.captured") {
      const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = event.payload?.payment?.entity?.id;

      if (orderId && paymentId) {
        await markTeamPaid(orderId, {
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
        });
        console.log(`[Razorpay Webhook] Order ${orderId} marked paid via webhook`);

        sendRegistrationConfirmationEmail(orderId).catch((emailErr) => {
          console.warn("[Razorpay Webhook] Confirmation email trigger notice:", emailErr.message);
        });
      }
    }

    return successResponse(res, { status: "OK" });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Error:", err);
    return errorResponse(res, "Webhook processing error", 500);
  }
}
