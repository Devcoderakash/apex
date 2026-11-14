/**
 * APEX//1.0 Automated Production Email Service
 * Handles:
 * 1. Participant registration confirmation via official Resend API
 * 2. Separate admin notifications to apexhackathon2k26@gmail.com
 * 3. Idempotency & duplicate prevention across callbacks, retries & webhooks
 * 4. Persistent retry handling with exponential backoff (up to 3 attempts)
 * 5. Multi-provider delivery (Resend API primary, fallback to SMTP if needed)
 * 6. Audit logging into memory and database
 * 7. Safe non-blocking execution (failures never reverse payments or registrations)
 */

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { config } from "../config/env.js";
import { supabase } from "./supabase.service.js";
import {
  EmailRegistrationData,
  generateAdminRegistrationNotificationEmail,
  generateRegistrationConfirmationEmail,
} from "./email-template.js";
import { getTeamByOrderId, REGISTRATION_FEE_INR } from "./registration.service.js";

export interface SendEmailResult {
  success: boolean;
  provider: "resend" | "smtp" | "simulated";
  messageId?: string;
  recipient: string;
  playerId: string;
  alreadySent?: boolean;
  error?: string;
  adminNotification?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
}

export interface EmailAuditRecord {
  team_id: string;
  player_id: string;
  recipient_email: string;
  email_type: "registration_confirmation" | "admin_notification";
  provider: string;
  provider_message_id?: string | null;
  status: "sent" | "failed" | "queued";
  attempt_count?: number;
  last_error?: string | null;
  sent_at?: string | null;
  updated_at?: string;
}

// In-memory cache to guarantee idempotency across rapid double-clicks, webhooks and page refreshes
const emailSentCache = new Set<string>();

// In-memory audit log for instant status lookups
const localEmailAuditLogs = new Map<string, EmailAuditRecord>();

/**
 * Resend API client singleton
 */
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = config.email.resendApiKey || process.env.RESEND_API_KEY;
  if (apiKey && apiKey.startsWith("re_")) {
    if (!resendClient) {
      resendClient = new Resend(apiKey);
    }
    return resendClient;
  }
  return null;
}

/**
 * Executes an async email sending action with exponential backoff retries.
 */
async function sendWithRetry<T>(
  action: () => Promise<T>,
  retries = 3,
  initialDelayMs = 1000,
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await action();
    } catch (err: any) {
      lastError = err;
      console.warn(`[Email Service] Attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Extracts and standardizes EmailRegistrationData from any team / apex_registrations record.
 */
export function extractEmailData(team: any, playerId: string): EmailRegistrationData {
  const rawLeader = team.team_leader_name || team.leader_name || "Team Leader";
  const rawCollege = team.college_organization || team.college || "";
  const rawAmount = team.amount_paid
    ? team.amount_paid / 100
    : team.payment_amount
      ? (team.payment_amount > 1000 ? team.payment_amount / 100 : team.payment_amount)
      : REGISTRATION_FEE_INR;
  const rawPaymentId = team.razorpay_payment_id || team.payment_id || "";
  const rawDriveLink = team.idea_drive_link || team.ppt_url || "";
  const rawAdditional: any[] = Array.isArray(team.additional_members)
    ? team.additional_members
    : Array.isArray(team.team_members)
      ? team.team_members
      : [];
  const formattedMembers = rawAdditional.map((m: any, idx: number) => ({
    full_name: typeof m === "string" ? m : m?.full_name || `Member ${idx + 2}`,
    position: idx + 2,
  }));

  return {
    playerId,
    teamName: team.team_name,
    leaderName: rawLeader,
    email: (team.email || "").trim(),
    phone: team.phone || "",
    college: rawCollege,
    teamSize: Number(team.team_size) || 1,
    members: formattedMembers,
    preferredDomain: team.preferred_domain,
    ideaDriveLink: rawDriveLink,
    pptFileName: team.ppt_file_name || null,
    pptStoragePath: team.ppt_storage_path || null,
    pptUrl: rawDriveLink,
    paymentStatus: team.payment_status || "paid",
    paymentAmount: rawAmount,
    paymentId: rawPaymentId,
    orderId: team.razorpay_order_id,
  };
}

/**
 * Persists email audit record into memory and Supabase.
 */
async function logEmailAudit(record: EmailAuditRecord) {
  const auditKey = `${record.player_id}_${record.email_type}`;
  localEmailAuditLogs.set(auditKey, {
    ...record,
    updated_at: new Date().toISOString(),
  });

  try {
    await supabase.from("registration_emails").upsert(
      {
        player_id: record.player_id,
        team_id: record.team_id,
        recipient_email: record.recipient_email,
        email_type: record.email_type,
        provider: record.provider,
        provider_message_id: record.provider_message_id || null,
        status: record.status,
        attempt_count: record.attempt_count || 1,
        last_error: record.last_error ? record.last_error.slice(0, 500) : null,
        sent_at: record.sent_at || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,email_type" },
    );
  } catch {
    // Graceful fallback: local store holds audit data
  }
}

/**
 * Sends separate Admin Notification Email to apexhackathon2k26@gmail.com.
 * Idempotent: will not send duplicates unless forceRetry is true.
 */
export async function sendAdminRegistrationNotification(
  identifier: string,
  forceRetry = false,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const team = await getTeamByOrderId(identifier);
    if (!team) {
      return { success: false, error: `Team not found for admin notice: ${identifier}` };
    }

    const playerId = team.r_id || team.player_id || identifier;
    const adminEmail = config.email.adminNotificationEmail || "apexhackathon2k26@gmail.com";
    const cacheKey = `${playerId}_admin_notification`;

    if (!forceRetry && emailSentCache.has(cacheKey)) {
      console.log(`[Email Service] Admin notification already sent for ${playerId} (cached).`);
      return { success: true, messageId: "cached_admin" };
    }

    const emailData = extractEmailData(team, playerId);
    const { subject, html, text } = generateAdminRegistrationNotificationEmail(emailData);

    let messageId = "";
    let providerUsed = "resend";
    const resend = getResendClient();

    if (resend) {
      const response = await sendWithRetry(async () => {
        const sendRes = await resend.emails.send({
          from: config.email.from || "APEX 1.0 Team <registrations@mail.apexhack.online>",
          to: [adminEmail],
          replyTo: team.email || config.email.replyTo || "apexhackathon2k26@gmail.com",
          subject,
          html,
          text,
        });
        if (sendRes.error) {
          throw new Error(sendRes.error.message);
        }
        return sendRes;
      });
      messageId = response.data?.id || `resend_admin_${Date.now()}`;
    } else if (config.email.smtp.pass) {
      // SMTP fallback
      const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });

      const info = await transporter.sendMail({
        from: config.email.from || `"APEX 1.0 Team" <registrations@mail.apexhack.online>`,
        to: adminEmail,
        replyTo: team.email || config.email.replyTo,
        subject,
        html,
        text,
      });
      messageId = info.messageId || `smtp_admin_${Date.now()}`;
      providerUsed = "smtp";
    } else {
      messageId = `sim_admin_${Date.now()}`;
      providerUsed = "simulated";
    }

    emailSentCache.add(cacheKey);
    console.log(`[Email Service] Admin notification dispatched to ${adminEmail} (ID: ${messageId})`);

    await logEmailAudit({
      team_id: team.id,
      player_id: playerId,
      recipient_email: adminEmail,
      email_type: "admin_notification",
      provider: providerUsed,
      provider_message_id: messageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return { success: true, messageId };
  } catch (err: any) {
    console.error("[Email Service] Admin notification failed after retries:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send automated registration confirmation email to participant.
 * Also triggers separate admin notification asynchronously.
 * Idempotent: will not send duplicates unless forceRetry is true.
 */
export async function sendRegistrationConfirmationEmail(
  identifier: string,
  forceRetry = false,
): Promise<SendEmailResult> {
  try {
    // 1. Fetch verified registration
    const team = await getTeamByOrderId(identifier);
    if (!team) {
      return {
        success: false,
        provider: "simulated",
        recipient: "",
        playerId: identifier,
        error: `Registration record not found for identifier: ${identifier}`,
      };
    }

    const teamId = team.id;
    const playerId = team.r_id || team.player_id || identifier;
    const recipientEmail = team.email?.trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return {
        success: false,
        provider: "simulated",
        recipient: recipientEmail || "",
        playerId,
        error: `Invalid or missing recipient email for team: ${team.team_name}`,
      };
    }

    // 2. Check Idempotency: Has participant email already been sent?
    const teamCacheKey = `${teamId}_registration_confirmation`;
    const playerCacheKey = `${playerId}_registration_confirmation`;
    const orderCacheKey = team.razorpay_order_id ? `${team.razorpay_order_id}_registration_confirmation` : "";

    if (!forceRetry) {
      if (
        emailSentCache.has(teamCacheKey) ||
        emailSentCache.has(playerCacheKey) ||
        (orderCacheKey && emailSentCache.has(orderCacheKey))
      ) {
        console.log(`[Email Service] Confirmation email already sent for team ${playerId} (memory cache).`);
        return {
          success: true,
          provider: "resend",
          recipient: recipientEmail,
          playerId,
          alreadySent: true,
        };
      }

      // Check DB log
      try {
        const { data: existingLog } = await supabase
          .from("registration_emails")
          .select("id, status, provider_message_id")
          .or(`team_id.eq.${teamId},player_id.eq.${playerId}`)
          .eq("email_type", "registration_confirmation")
          .eq("status", "sent")
          .maybeSingle();

        if (existingLog) {
          emailSentCache.add(teamCacheKey);
          emailSentCache.add(playerCacheKey);
          if (orderCacheKey) emailSentCache.add(orderCacheKey);
          console.log(`[Email Service] Confirmation email already sent for team ${playerId} (DB log).`);
          return {
            success: true,
            provider: "resend",
            messageId: existingLog.provider_message_id,
            recipient: recipientEmail,
            playerId,
            alreadySent: true,
          };
        }
      } catch {
        // Table lookup fallback
      }
    }

    // 3. Prepare email data
    const emailData = extractEmailData(team, playerId);
    const { subject, html, text } = generateRegistrationConfirmationEmail(emailData);

    let providerUsed: "resend" | "smtp" | "simulated" = "simulated";
    let messageId = "";
    let sendError: string | null = null;

    // 4. Provider Dispatch with Retry Logic
    const resend = getResendClient();
    if (resend) {
      try {
        const resendResponse = await sendWithRetry(async () => {
          const res = await resend.emails.send({
            from: config.email.from || "APEX 1.0 Team <registrations@mail.apexhack.online>",
            to: [recipientEmail],
            replyTo: config.email.replyTo || "apexhackathon2k26@gmail.com",
            subject,
            html,
            text,
          });
          if (res.error) {
            throw new Error(res.error.message);
          }
          return res;
        });

        messageId = resendResponse.data?.id || `resend_${Date.now()}`;
        providerUsed = "resend";
        console.log(`[Email Service] Participant confirmation delivered via Resend to ${recipientEmail} (ID: ${messageId})`);
      } catch (resendErr: any) {
        console.warn("[Email Service] Resend attempt error, falling back to SMTP:", resendErr.message);
        sendError = resendErr.message;
      }
    }

    // Fallback: Nodemailer SMTP
    if (!messageId && config.email.smtp.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure,
          auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass,
          },
        });

        const info = await sendWithRetry(async () => {
          return await transporter.sendMail({
            from: config.email.from || `"${config.email.senderName}" <registrations@mail.apexhack.online>`,
            to: recipientEmail,
            replyTo: config.email.replyTo,
            subject,
            html,
            text,
          });
        });

        messageId = info.messageId || `smtp_${Date.now()}`;
        providerUsed = "smtp";
        sendError = null;
        console.log(`[Email Service] Delivered via SMTP to ${recipientEmail} (ID: ${messageId})`);
      } catch (smtpErr: any) {
        console.error("[Email Service] SMTP delivery failed:", smtpErr.message);
        sendError = smtpErr.message;
      }
    }

    // Dev Fallback Simulation
    if (!messageId && !sendError) {
      messageId = `sim_apex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      providerUsed = "simulated";
      console.log(`[Email Service] Simulated email generated for ${recipientEmail} (${playerId}) | Subject: ${subject}`);
    }

    const isSuccess = Boolean(messageId);
    if (isSuccess) {
      emailSentCache.add(teamCacheKey);
      emailSentCache.add(playerCacheKey);
      if (orderCacheKey) emailSentCache.add(orderCacheKey);
    }

    // 5. Audit Logging to Database
    await logEmailAudit({
      team_id: teamId,
      player_id: playerId,
      recipient_email: recipientEmail,
      email_type: "registration_confirmation",
      provider: providerUsed,
      provider_message_id: messageId || null,
      status: isSuccess ? "sent" : "failed",
      attempt_count: 1,
      last_error: sendError ? sendError.slice(0, 500) : null,
      sent_at: isSuccess ? new Date().toISOString() : null,
    });

    // 6. Asynchronously trigger Admin Notification (never blocks participant return)
    let adminResult: { success: boolean; messageId?: string; error?: string } | undefined;
    sendAdminRegistrationNotification(identifier, forceRetry)
      .then((res) => {
        adminResult = res;
      })
      .catch((adminErr) => {
        console.warn("[Email Service] Admin notice notice:", adminErr.message);
      });

    return {
      success: isSuccess,
      provider: providerUsed,
      messageId: messageId || undefined,
      recipient: recipientEmail,
      playerId,
      error: sendError || undefined,
      adminNotification: adminResult,
    };
  } catch (outerErr: any) {
    console.error("[Email Service] Critical error in sendRegistrationConfirmationEmail:", outerErr.message);
    return {
      success: false,
      provider: "resend",
      recipient: "",
      playerId: identifier,
      error: outerErr.message,
    };
  }
}

/**
 * Check the confirmation email delivery status for a given team.
 */
export async function getEmailDeliveryStatus(identifier: string) {
  if (!identifier) return null;
  const cleanId = identifier.trim();

  // 1. Check local audit logs first
  const participantAudit = localEmailAuditLogs.get(`${cleanId}_registration_confirmation`);
  const adminAudit = localEmailAuditLogs.get(`${cleanId}_admin_notification`);

  if (participantAudit) {
    return {
      status: participantAudit.status,
      provider: participantAudit.provider,
      provider_message_id: participantAudit.provider_message_id,
      sent_at: participantAudit.sent_at,
      admin_status: adminAudit?.status || "sent",
      admin_message_id: adminAudit?.provider_message_id,
    };
  }

  // 2. Query Supabase registration_emails
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let query = supabase.from("registration_emails").select("*");
    if (isUuid) {
      query = query.or(`team_id.eq.${cleanId},player_id.eq.${cleanId}`);
    } else {
      query = query.eq("player_id", cleanId);
    }
    const { data } = await query.maybeSingle();
    if (data) return data;
  } catch {}

  // 3. Fallback to memory cache
  for (const key of emailSentCache) {
    if (key.includes(cleanId)) {
      return { status: "sent", provider: "cached" };
    }
  }

  return { status: "not_sent" };
}
