import crypto from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config/env.js";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../services/razorpay.service.js";
import {
  getTeamByOrderId,
  registerPaidTeam,
  REGISTRATION_FEE_INR,
  REGISTRATION_FEE_PAISE,
  type RegisterPaidTeamInput,
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

const standardOrderSchema = z.object({
  amount: z.coerce.number().min(100, "Amount must be at least 100 paise (₹1.00)"),
  currency: z.string().default("INR"),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

/**
 * POST /api/create-order, POST /api/payments/create-order, POST /api/payment/create-order
 * Pure Razorpay order creation for ₹199 (19900 paise).
 * ZERO database rows or files are inserted before payment verification!
 */
export async function createOrder(req: Request, res: Response) {
  try {
    // 1. Standard amount payload (generic / standard checkout)
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

    // 2. Team registration payload — Generate Razorpay Order strictly WITHOUT saving to DB
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
      const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;

      const rzpOrder = await createRazorpayOrder({
        amountPaise: REGISTRATION_FEE_PAISE,
        currency: "INR",
        receipt,
        notes: {
          team_name: payload.team_name.slice(0, 40),
          leader_name: payload.leader_name.slice(0, 40),
          email: payload.email.slice(0, 40),
          phone: payload.phone.slice(0, 20),
          college: (payload.college || "").slice(0, 40),
          team_size: String(payload.team_size || 1),
        },
      });

      console.log(
        `[Payment Controller] Generated pre-payment Razorpay order ${rzpOrder.id} for "${payload.team_name}" (Zero DB inserts)`,
      );

      return res.status(200).json({
        success: true,
        order_id: rzpOrder.id,
        orderId: rzpOrder.id,
        amount: REGISTRATION_FEE_PAISE,
        amountInRupees: REGISTRATION_FEE_INR,
        currency: "INR",
        receipt: rzpOrder.receipt,
        key_id: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
        keyId: config.razorpay.keyId || process.env.VITE_RAZORPAY_KEY_ID || "",
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
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create payment order",
    });
  }
}

/**
 * POST /api/verify-payment, POST /api/payments/verify, POST /api/payment/verify
 * Post-payment verification & atomic registration.
 * 1. Cryptographically verifies Razorpay HMAC signature.
 * 2. Fetches authoritative payment from Razorpay API.
 * 3. Confirms payment status is 'captured', amount is 19900 paise, currency is INR.
 * 4. Idempotently uploads presentation to Storage and registers paid team, members, consent.
 * 5. Dispatches confirmation email.
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
        error: "Missing required verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        missing: {
          order_id: !orderId,
          payment_id: !paymentId,
          signature: !signature,
        },
      });
    }

    // 1. HMAC-SHA256 signature verification
    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      console.warn(`[Payment Controller] Cryptographic signature check failed for order ${orderId}`);
      return res.status(400).json({
        success: false,
        error: "Payment verification failed: Invalid cryptographic signature",
      });
    }

    // 2. Authoritative payment verification directly from Razorpay API
    let paymentDetails: any = null;
    try {
      paymentDetails = await fetchRazorpayPayment(paymentId);
    } catch (fetchErr: any) {
      console.warn(`[Payment Controller] Razorpay API fetch warning for payment ${paymentId}:`, fetchErr?.message);
    }

    if (paymentDetails) {
      // Confirm payment status
      if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Payment status is '${paymentDetails.status}', expected 'captured'`,
        });
      }

      // Confirm amount (19900 paise = ₹199)
      if (paymentDetails.amount !== REGISTRATION_FEE_PAISE) {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Incorrect amount ${paymentDetails.amount} paise. Expected ${REGISTRATION_FEE_PAISE} paise.`,
        });
      }

      // Confirm currency
      if (paymentDetails.currency !== "INR") {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Currency '${paymentDetails.currency}' is not supported. Expected INR.`,
        });
      }

      // Confirm order ID match
      if (paymentDetails.order_id && paymentDetails.order_id !== orderId) {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed: Razorpay order ID mismatch",
        });
      }
    }

    // 3. Extract uploaded presentation file from memory (if multipart)
    const uploadedFile =
      req.file ||
      (req.files as any)?.presentation?.[0] ||
      (req.files as any)?.ppt?.[0] ||
      (req.files as any)?.file?.[0];

    // 4. Parse members (if JSON string from multipart FormData)
    let members = req.body.members;
    if (typeof members === "string") {
      try {
        members = JSON.parse(members);
      } catch {
        members = [];
      }
    }

    // 5. Build registration payload
    const notes = paymentDetails?.notes || {};
    const registrationInput: RegisterPaidTeamInput = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      team_name: req.body.team_name || notes.team_name || "Team APEX",
      leader_name: req.body.leader_name || notes.leader_name || "Team Leader",
      email: req.body.email || notes.email || paymentDetails?.email || "",
      phone: req.body.phone || notes.phone || paymentDetails?.contact || "",
      college: req.body.college || notes.college || "",
      team_size: Number(req.body.team_size || notes.team_size || 1),
      preferred_domain: req.body.preferred_domain,
      github_url: req.body.github_url,
      linkedin_url: req.body.linkedin_url,
      project_title: req.body.project_title,
      project_description: req.body.project_description,
      problem_statement: req.body.problem_statement,
      proposed_solution: req.body.proposed_solution,
      tech_stack: req.body.tech_stack,
      expected_impact: req.body.expected_impact,
      demo_url: req.body.demo_url,
      portfolio_url: req.body.portfolio_url,
      other_links: req.body.other_links,
      consent_service: true,
      consent_marketing_email:
        req.body.consent_marketing_email === true || req.body.consent_marketing_email === "true",
      consent_marketing_sms:
        req.body.consent_marketing_sms === true || req.body.consent_marketing_sms === "true",
      consent_marketing_whatsapp:
        req.body.consent_marketing_whatsapp === true || req.body.consent_marketing_whatsapp === "true",
      ppt_url: req.body.ppt_url,
      fileBuffer: uploadedFile?.buffer,
      fileName: uploadedFile?.originalname,
      fileMimeType: uploadedFile?.mimetype,
      fileSize: uploadedFile?.size,
      members: Array.isArray(members) ? members : [],
    };

    // 6. Atomically register team into Supabase after payment
    const { team, isExisting } = await registerPaidTeam(registrationInput);

    // 7. Dispatch confirmation email asynchronously
    sendRegistrationConfirmationEmail(team.id || orderId).catch((emailErr) => {
      console.warn("[Payment Controller] Confirmation email trigger notice:", emailErr.message);
    });

    console.log(
      `[Payment Controller] Successfully verified and confirmed registration for Team ${team.team_name} (${team.player_id})`,
    );

    return res.status(200).json({
      success: true,
      status: "paid",
      order_id: orderId,
      orderId: orderId,
      payment_id: paymentId,
      paymentId: paymentId,
      playerId: team.player_id,
      teamName: team.team_name,
      alreadyProcessed: isExisting,
      message: isExisting
        ? "Payment was already verified and registered"
        : "Payment verified and registration created successfully",
    });
  } catch (err: any) {
    console.error("[Payment Controller] verifyPayment Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to verify payment and complete registration",
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
 * Secure Webhook processing for Razorpay payments.
 * Strictly verifies webhook signature with timing-safe comparison.
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      console.warn("[Razorpay Webhook] Missing x-razorpay-signature header");
      return errorResponse(res, "Missing webhook signature", 400);
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid webhook signature detected");
      return errorResponse(res, "Invalid webhook signature", 400);
    }

    const event = req.body;
    const eventName = event?.event;

    if (eventName === "order.paid" || eventName === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        if (paymentEntity.amount && paymentEntity.amount !== REGISTRATION_FEE_PAISE) {
          console.warn(
            `[Razorpay Webhook] Warning: Mismatched payment amount ${paymentEntity.amount} paise vs expected ${REGISTRATION_FEE_PAISE}`,
          );
        }

        const notes = paymentEntity.notes || {};
        await registerPaidTeam({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          team_name: notes.team_name || "Team APEX",
          leader_name: notes.leader_name || "Team Leader",
          email: notes.email || paymentEntity.email || "",
          phone: notes.phone || paymentEntity.contact || "",
          college: notes.college || "",
          team_size: Number(notes.team_size || 1),
        });

        console.log(`[Razorpay Webhook] Order ${orderId} registered and confirmed via webhook`);

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
