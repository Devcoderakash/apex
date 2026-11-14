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
  getPendingCheckout,
  getRegistrationById,
  registerPaidTeam,
  REGISTRATION_FEE_INR,
  REGISTRATION_FEE_PAISE,
  storePendingCheckout,
} from "../services/registration.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

const GOOGLE_DRIVE_PATTERNS = [
  /^https:\/\/(?:drive|docs)\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/open\?id=[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/i,
];

const driveLinkValidator = z
  .string({ required_error: "Please provide your Google Drive presentation link." })
  .trim()
  .min(1, "Please provide your Google Drive presentation link.")
  .max(500, "Google Drive link is too long")
  .refine(
    (val) => {
      const clean = val.trim();
      return GOOGLE_DRIVE_PATTERNS.some((p) => p.test(clean));
    },
    { message: "Please enter a valid Google Drive link." },
  );

export const registrationPayloadSchema = z
  .object({
    team_name: z.string().trim().min(2, "Team name is required").max(80),
    team_leader_name: z.string().trim().min(2, "Team leader name is required").max(80).optional(),
    leader_name: z.string().trim().min(2, "Team leader name is required").max(80).optional(),
    email: z.string().trim().email("Valid email required").max(255),
    phone: z.string().trim().min(7, "Valid phone required").max(20),
    college_organization: z.string().trim().min(2, "College/Organization is required").max(120).optional(),
    college: z.string().trim().min(2, "College/Organization is required").max(120).optional(),
    team_size: z.coerce.number().min(1, "Team size must be between 1 and 4").max(4, "Team size cannot exceed 4"),
    additional_members: z.array(z.string().trim().min(1)).optional().default([]),
    members: z.array(z.object({ full_name: z.string().min(1), position: z.number().optional() })).optional(),
    idea_drive_link: driveLinkValidator.optional(),
    ppt_url: z.string().optional(),
    preferred_domain: z.string().trim().max(120).optional().nullable(),
    github_url: z.string().trim().max(500).optional().nullable(),
    linkedin_url: z.string().trim().max(500).optional().nullable(),
    terms_accepted: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const leader = data.team_leader_name || data.leader_name;
    if (!leader || leader.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["team_leader_name"],
        message: "Team leader name is required",
      });
    }

    const college = data.college_organization || data.college;
    if (!college || college.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["college_organization"],
        message: "College or Organization is required",
      });
    }

    const driveLink = data.idea_drive_link || data.ppt_url;
    if (!driveLink || !GOOGLE_DRIVE_PATTERNS.some((p) => p.test(driveLink.trim()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["idea_drive_link"],
        message: "Please enter a valid Google Drive link.",
      });
    }
  });

/**
 * POST /api/registrations/create-order, POST /api/create-order
 * Validates payload and creates Razorpay Order for ₹199 (19900 paise).
 * Binds checkout payload securely on server without inserting confirmed DB rows!
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const parseResult = registrationPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error in registration fields",
        details: parseResult.error.format(),
      });
    }

    const payload = parseResult.data;
    const leaderName = (payload.team_leader_name || payload.leader_name || "").trim();
    const college = (payload.college_organization || payload.college || "").trim();
    const driveLink = (payload.idea_drive_link || payload.ppt_url || "").trim();

    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;

    // Create authoritative Razorpay order
    const rzpOrder = await createRazorpayOrder({
      amountPaise: REGISTRATION_FEE_PAISE,
      currency: "INR",
      receipt,
      notes: {
        team_name: payload.team_name.slice(0, 40),
        leader_name: leaderName.slice(0, 40),
        email: payload.email.slice(0, 40),
        phone: payload.phone.slice(0, 20),
        college: college.slice(0, 40),
        team_size: String(payload.team_size),
        idea_drive_link: driveLink.slice(0, 250),
      },
    });

    // Securely bind validated checkout payload to this orderId
    storePendingCheckout(rzpOrder.id, {
      ...payload,
      team_leader_name: leaderName,
      college_organization: college,
      idea_drive_link: driveLink,
    });

    console.log(`[Payment Controller] Created Razorpay order ${rzpOrder.id} for "${payload.team_name}"`);

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
      team_name: payload.team_name,
      leaderName,
      email: payload.email,
      phone: payload.phone,
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
 * POST /api/registrations/verify-payment, POST /api/verify-payment
 * 1. Cryptographically verifies HMAC-SHA256 signature.
 * 2. Fetches payment from Razorpay API to confirm captured status and ₹199 amount.
 * 3. Retrieves bound checkout payload.
 * 4. Atomically creates confirmed registration in public.apex_registrations.
 * 5. Returns unique R_ID (APEX-XXXXXXXXXXXXXXX).
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
      });
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      console.warn(`[Payment Controller] Signature check failed for order ${orderId}`);
      return res.status(400).json({
        success: false,
        error: "Payment verification failed: Invalid cryptographic signature",
      });
    }

    // 2. Authoritative payment verification via Razorpay API
    let paymentDetails: any = null;
    try {
      paymentDetails = await fetchRazorpayPayment(paymentId);
    } catch (fetchErr: any) {
      console.warn(`[Payment Controller] Razorpay API warning for ${paymentId}:`, fetchErr?.message);
    }

    if (paymentDetails) {
      if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Payment status is '${paymentDetails.status}', expected 'captured'`,
        });
      }

      if (paymentDetails.amount !== REGISTRATION_FEE_PAISE) {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Incorrect amount ${paymentDetails.amount} paise. Expected ${REGISTRATION_FEE_PAISE} paise.`,
        });
      }

      if (paymentDetails.currency !== "INR") {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: Currency '${paymentDetails.currency}' is not supported. Expected INR.`,
        });
      }

      if (paymentDetails.order_id && paymentDetails.order_id !== orderId) {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed: Razorpay order ID mismatch",
        });
      }
    }

    // 3. Retrieve pre-validated checkout payload or use request body
    const pendingPayload = getPendingCheckout(orderId);
    const notes = paymentDetails?.notes || {};

    const teamName =
      pendingPayload?.team_name ||
      req.body.team_name ||
      notes.team_name ||
      "Team APEX";

    const leaderName =
      pendingPayload?.team_leader_name ||
      pendingPayload?.leader_name ||
      req.body.team_leader_name ||
      req.body.leader_name ||
      notes.leader_name ||
      "Team Leader";

    const email =
      pendingPayload?.email ||
      req.body.email ||
      notes.email ||
      paymentDetails?.email ||
      "";

    const phone =
      pendingPayload?.phone ||
      req.body.phone ||
      notes.phone ||
      paymentDetails?.contact ||
      "";

    const college =
      pendingPayload?.college_organization ||
      pendingPayload?.college ||
      req.body.college_organization ||
      req.body.college ||
      notes.college ||
      "";

    const teamSize = Number(
      pendingPayload?.team_size ||
      req.body.team_size ||
      notes.team_size ||
      1,
    );

    const driveLink = (
      pendingPayload?.idea_drive_link ||
      req.body.idea_drive_link ||
      req.body.ppt_url ||
      notes.idea_drive_link ||
      ""
    ).trim();

    // 4. Atomically register verified team into public.apex_registrations
    const { registration, isExisting } = await registerPaidTeam({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      team_name: teamName,
      team_leader_name: leaderName,
      email,
      phone,
      college_organization: college,
      team_size: teamSize,
      additional_members: pendingPayload?.additional_members || req.body.additional_members || req.body.members,
      preferred_domain: pendingPayload?.preferred_domain || req.body.preferred_domain,
      github_url: pendingPayload?.github_url || req.body.github_url,
      linkedin_url: pendingPayload?.linkedin_url || req.body.linkedin_url,
      idea_drive_link: driveLink,
      terms_accepted: true,
    });

    // 5. Trigger confirmation email asynchronously
    sendRegistrationConfirmationEmail(registration.r_id || orderId).catch((emailErr) => {
      console.warn("[Payment Controller] Confirmation email notice:", emailErr.message);
    });

    console.log(`[Payment Controller] Registration confirmed: ${registration.r_id} (${registration.team_name})`);

    return res.status(200).json({
      success: true,
      status: "paid",
      r_id: registration.r_id,
      playerId: registration.r_id,
      player_id: registration.r_id,
      team_name: registration.team_name,
      teamName: registration.team_name,
      team_leader_name: registration.team_leader_name,
      leaderName: registration.team_leader_name,
      amount_paid: REGISTRATION_FEE_PAISE,
      registration_status: "confirmed",
      order_id: orderId,
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
 * GET /api/registrations/:r_id or GET /api/payment/order/:orderId
 * Safe lookup for participant confirmation
 */
export async function getRegistration(req: Request, res: Response) {
  try {
    const identifier = req.params.r_id || req.params.orderId || req.params.id;
    if (!identifier) {
      return errorResponse(res, "Registration identifier is required", 400);
    }

    const reg = await getRegistrationById(identifier);
    if (!reg) {
      return errorResponse(res, "Registration not found", 404);
    }

    // Return only safe public fields
    return successResponse(res, {
      r_id: reg.r_id,
      player_id: reg.r_id,
      team_name: reg.team_name,
      team_leader_name: reg.team_leader_name,
      college_organization: reg.college_organization,
      team_size: reg.team_size,
      payment_status: reg.payment_status,
      registration_status: reg.registration_status,
      amount_paid: reg.amount_paid,
      created_at: reg.created_at,
    });
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

export const getOrder = getRegistration;
export const getRegistrationStatus = getRegistration;

/**
 * POST /api/webhooks/razorpay, POST /api/payments/webhook
 * Idempotent Webhook Handler for Razorpay events
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      return errorResponse(res, "Missing webhook signature", 400);
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return errorResponse(res, "Invalid webhook signature", 400);
    }

    const event = req.body;
    const eventName = event?.event;

    if (eventName === "order.paid" || eventName === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        const notes = paymentEntity.notes || {};
        const pending = getPendingCheckout(orderId);

        await registerPaidTeam({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          team_name: pending?.team_name || notes.team_name || "Team APEX",
          team_leader_name: pending?.team_leader_name || notes.leader_name || "Team Leader",
          email: pending?.email || notes.email || paymentEntity.email || "",
          phone: pending?.phone || notes.phone || paymentEntity.contact || "",
          college_organization: pending?.college_organization || notes.college || "",
          team_size: Number(pending?.team_size || notes.team_size || 1),
          additional_members: pending?.additional_members,
          idea_drive_link: pending?.idea_drive_link || notes.idea_drive_link || "",
          terms_accepted: true,
        });

        console.log(`[Razorpay Webhook] Order ${orderId} confirmed via webhook`);
      }
    }

    return successResponse(res, { status: "OK" });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Error:", err);
    return errorResponse(res, "Webhook processing error", 500);
  }
}
