import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "../services/supabase.service.js";
import {
  deleteStoredTeam,
  getAllStoredTeams,
  getRegistrationById,
  updateRegistrationReview,
  updateStoredTeam,
  REGISTRATION_FEE_INR,
  REGISTRATION_FEE_PAISE,
  type ApexRegistrationRecord,
} from "../services/registration.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

const PPT_BUCKET = "apex-presentations";

/**
 * Normalizes an apex_registration or team row for API responses
 */
function normalizeRegistrationRow(row: any) {
  const rId = row.r_id || row.player_id || "";
  const leaderName = row.team_leader_name || row.leader_name || "";
  const college = row.college_organization || row.college || "";
  const driveLink = row.idea_drive_link || row.ppt_url || "";

  return {
    ...row,
    // Canonical identifiers
    id: row.id,
    r_id: rId,
    player_id: rId, // Frontend alias
    // Team Information
    team_name: row.team_name,
    team_leader_name: leaderName,
    leader_name: leaderName, // Frontend alias
    email: row.email,
    phone: row.phone,
    college_organization: college,
    college: college, // Frontend alias
    team_size: Number(row.team_size) || 1,
    additional_members: Array.isArray(row.additional_members) ? row.additional_members : [],
    preferred_domain: row.preferred_domain || null,
    github_url: row.github_url || null,
    linkedin_url: row.linkedin_url || null,
    // Idea Presentation Link
    idea_drive_link: driveLink,
    ppt_url: driveLink, // Frontend alias
    // Statuses
    review_status: row.review_status || (row.status === "approved" ? "shortlisted" : "pending"),
    registration_status: row.registration_status || "confirmed",
    status:
      row.status ||
      (row.review_status === "shortlisted"
        ? "approved"
        : row.review_status === "rejected"
          ? "rejected"
          : "pending"),
    admin_notes: row.admin_notes || null,
    // Payment
    payment_status: row.payment_status || "paid",
    payment_id: row.razorpay_payment_id || row.payment_id || null,
    payment_order_id: row.razorpay_order_id || row.payment_order_id || null,
    payment_amount: row.amount_paid
      ? row.amount_paid / 100
      : row.payment_amount
        ? (row.payment_amount >= 100 ? row.payment_amount / 100 : row.payment_amount)
        : REGISTRATION_FEE_INR,
    amount_paid:
      row.amount_paid !== undefined && row.amount_paid !== null
        ? row.amount_paid
        : row.payment_amount
          ? (row.payment_amount < 100 ? row.payment_amount * 100 : row.payment_amount)
          : REGISTRATION_FEE_PAISE,
    currency: row.currency || "INR",
    payment_verified_at: row.payment_verified_at || row.paid_at || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

/**
 * GET /api/admin/registrations
 * Server-side search, filtering, and pagination across apex_registrations.
 */
export async function getRegistrations(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;
    const q = (req.query.q as string)?.trim();
    const paymentStatus = req.query.payment_status as string;
    const registrationStatus = req.query.registration_status as string;
    const reviewStatus = req.query.review_status as string;

    // 1. Try querying primary apex_registrations table
    try {
      let query = supabase
        .from("apex_registrations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (paymentStatus && paymentStatus !== "all") {
        query = query.eq("payment_status", paymentStatus);
      }
      if (registrationStatus && registrationStatus !== "all") {
        query = query.eq("registration_status", registrationStatus);
      }
      if (reviewStatus && reviewStatus !== "all") {
        query = query.eq("review_status", reviewStatus);
      }
      if (q) {
        query = query.or(
          `r_id.ilike.%${q}%,team_name.ilike.%${q}%,team_leader_name.ilike.%${q}%,email.ilike.%${q}%,college_organization.ilike.%${q}%`
        );
      }

      query = query.range(offset, offset + limit - 1);

      const { data: dbRows, error, count } = await query;

      if (!error && dbRows) {
        const normalized = dbRows.map(normalizeRegistrationRow);
        if (req.query.paginated === "true") {
          return res.json({
            success: true,
            data: normalized,
            pagination: {
              page,
              limit,
              total: count ?? normalized.length,
              totalPages: Math.ceil((count ?? normalized.length) / limit),
            },
          });
        }
        return successResponse(res, normalized);
      }
    } catch (e: any) {
      console.warn("[Admin Controller] apex_registrations query error:", e.message);
    }

    // 2. Fallback to teams table or local store
    let records: any[] = [];
    try {
      const { data: teams, error } = await supabase
        .from("teams")
        .select("*, team_members(*)")
        .order("created_at", { ascending: false });

      if (!error && teams && teams.length > 0) {
        records = teams;
      } else {
        records = getAllStoredTeams();
      }
    } catch {
      records = getAllStoredTeams();
    }

    // Apply in-memory filtering & search on fallback
    let filtered = records.map(normalizeRegistrationRow);

    if (paymentStatus && paymentStatus !== "all") {
      filtered = filtered.filter((t) => t.payment_status === paymentStatus);
    }
    if (registrationStatus && registrationStatus !== "all") {
      filtered = filtered.filter((t) => t.registration_status === registrationStatus);
    }
    if (reviewStatus && reviewStatus !== "all") {
      filtered = filtered.filter(
        (t) =>
          t.review_status === reviewStatus ||
          (reviewStatus === "shortlisted" && t.status === "approved")
      );
    }
    if (q) {
      const qLower = q.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          `${t.r_id} ${t.player_id} ${t.team_name} ${t.team_leader_name} ${t.leader_name} ${t.email} ${t.college_organization} ${t.college}`
            .toLowerCase()
            .includes(qLower)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    if (req.query.paginated === "true") {
      return res.json({
        success: true,
        data: paged,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return successResponse(res, paged);
  } catch (err: any) {
    const fallback = getAllStoredTeams().map(normalizeRegistrationRow);
    return successResponse(res, fallback);
  }
}

/**
 * GET /api/admin/registrations/:id/ppt-url
 * Returns presentation link (Google Drive URL) or signed download URL for backward compatibility.
 */
export async function getTeamPptSignedUrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let team: any = null;

    // Check apex_registrations first
    const { data: dbReg, error: regErr } = await supabase
      .from("apex_registrations")
      .select("id, r_id, idea_drive_link, team_name")
      .or(`id.eq.${id},r_id.eq.${id}`)
      .maybeSingle();

    if (!regErr && dbReg) {
      team = dbReg;
    } else {
      const { data: dbTeam, error: teamErr } = await supabase
        .from("teams")
        .select("id, ppt_storage_path, ppt_file_name, ppt_file_type, idea_drive_link, ppt_url")
        .eq("id", id)
        .maybeSingle();

      if (!teamErr && dbTeam) {
        team = dbTeam;
      } else {
        team = await getRegistrationById(id);
      }
    }

    if (!team) return errorResponse(res, "Registration not found", 404);

    const driveLink = team.idea_drive_link || team.ppt_url;
    if (driveLink) {
      return successResponse(res, {
        signedUrl: driveLink,
        url: driveLink,
        driveLink: driveLink,
        fileName: "Google Drive Presentation",
        mimeType: "text/html",
        expiresIn: 0,
      });
    }

    if (!team.ppt_storage_path) {
      return errorResponse(res, "No presentation link or file stored for this team", 404);
    }

    const fileName = path.basename(team.ppt_storage_path);
    const localFilePath = path.join(process.cwd(), "uploads", "submissions", fileName);

    let signedUrl = "";
    if (fs.existsSync(localFilePath)) {
      const protocol = req.protocol;
      const host = req.get("host") || "localhost:5002";
      signedUrl = `${protocol}://${host}/api/upload/file/${encodeURIComponent(fileName)}`;
    } else {
      try {
        const { data, error: signErr } = await supabase.storage
          .from(PPT_BUCKET)
          .createSignedUrl(team.ppt_storage_path, 3600); // 1 hour

        if (!signErr && data?.signedUrl) {
          signedUrl = data.signedUrl;
        }
      } catch {}

      if (!signedUrl) {
        const protocol = req.protocol;
        const host = req.get("host") || "localhost:5002";
        signedUrl = `${protocol}://${host}/api/upload/file/${encodeURIComponent(fileName)}`;
      }
    }

    return successResponse(res, {
      signedUrl,
      fileName: team.ppt_file_name || fileName,
      mimeType: team.ppt_file_type || "application/pdf",
      expiresIn: 3600,
    });
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * GET /api/admin/stats
 */
export async function getStats(_req: Request, res: Response) {
  try {
    let teamList: any[] = [];

    const { data: regs, error: regErr } = await supabase
      .from("apex_registrations")
      .select("id, r_id, review_status, registration_status, payment_status, team_size, amount_paid");

    if (!regErr && regs && regs.length > 0) {
      teamList = regs;
    } else {
      const { data: teams, error: teamErr } = await supabase
        .from("teams")
        .select("id, status, payment_status, team_size");
      teamList = (!teamErr && teams) ? teams : getAllStoredTeams();
    }

    const totalTeams = teamList.length;
    const paidTeams = teamList.filter((t) => t.payment_status === "paid").length;
    const approvedTeams = teamList.filter(
      (t) => t.review_status === "shortlisted" || t.status === "approved"
    ).length;
    const pendingTeams = teamList.filter(
      (t) => (t.review_status || t.status || "pending") === "pending"
    ).length;
    const totalParticipants = teamList.reduce(
      (acc, t) => acc + (Number(t.team_size) || 1),
      0
    );

    return successResponse(res, {
      totalTeams,
      paidTeams,
      approvedTeams,
      pendingTeams,
      totalParticipants,
    });
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * PATCH /api/admin/registrations/:id/review
 * PATCH /api/admin/teams/:id/review
 * Update review status ('pending' | 'shortlisted' | 'rejected') and admin notes.
 * Strictly prevents overwriting payment verification fields.
 */
export async function updateReviewStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { review_status, status, admin_notes } = req.body;

    const rawStatus = review_status || status;
    let targetStatus: "pending" | "shortlisted" | "rejected" | undefined;

    if (rawStatus) {
      if (rawStatus === "approved") {
        targetStatus = "shortlisted";
      } else if (["pending", "shortlisted", "rejected"].includes(rawStatus)) {
        targetStatus = rawStatus as "pending" | "shortlisted" | "rejected";
      } else {
        return errorResponse(
          res,
          "Invalid review status. Must be pending, shortlisted, or rejected",
          400
        );
      }
    }

    const updated = await updateRegistrationReview(id, {
      review_status: targetStatus,
      admin_notes: admin_notes !== undefined ? String(admin_notes) : undefined,
    });

    if (updated) {
      return successResponse(res, normalizeRegistrationRow(updated));
    }

    return errorResponse(res, "Registration not found", 404);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * PATCH /api/admin/teams/:id/status
 */
export async function updateTeamStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "shortlisted"].includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const reviewStatus: "pending" | "shortlisted" | "rejected" =
      status === "approved" ? "shortlisted" : status;

    const updated = await updateRegistrationReview(id, {
      review_status: reviewStatus,
    });

    if (updated) {
      return successResponse(res, normalizeRegistrationRow(updated));
    }

    const { data, error } = await supabase
      .from("teams")
      .update({ status: status === "shortlisted" ? "approved" : status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      const fallback = updateStoredTeam(id, { status });
      if (fallback) return successResponse(res, normalizeRegistrationRow(fallback));
      return errorResponse(res, error.message, 500);
    }

    updateStoredTeam(id, { status });
    return successResponse(res, normalizeRegistrationRow(data));
  } catch (err: any) {
    const fallback = updateStoredTeam(req.params.id, { status: req.body?.status });
    if (fallback) return successResponse(res, normalizeRegistrationRow(fallback));
    return errorResponse(res, err.message, 500);
  }
}

/**
 * PUT /api/admin/teams/:id
 * Updates team registration details.
 * STRICT SECURITY: Never allows modifying verified payment fields or R_ID.
 */
export async function updateTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      team_name,
      team_leader_name,
      leader_name,
      email,
      phone,
      college_organization,
      college,
      team_size,
      status,
      review_status,
      admin_notes,
      preferred_domain,
    } = req.body;

    const leader = team_leader_name || leader_name;
    const collegeOrg = college_organization || college;
    const normalizedReview =
      review_status || (status === "approved" ? "shortlisted" : status);

    const payload: Record<string, any> = {
      ...(team_name !== undefined && { team_name }),
      ...(leader !== undefined && { team_leader_name: leader, leader_name: leader }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(collegeOrg !== undefined && {
        college_organization: collegeOrg,
        college: collegeOrg,
      }),
      ...(team_size !== undefined && { team_size: Number(team_size) }),
      ...(normalizedReview !== undefined && { review_status: normalizedReview }),
      ...(admin_notes !== undefined && { admin_notes }),
      ...(preferred_domain !== undefined && { preferred_domain }),
      updated_at: new Date().toISOString(),
    };

    // Strict security check: Ensure payment fields and identifiers cannot be altered
    delete (payload as any).id;
    delete (payload as any).r_id;
    delete (payload as any).player_id;
    delete (payload as any).payment_status;
    delete (payload as any).amount_paid;
    delete (payload as any).currency;
    delete (payload as any).razorpay_order_id;
    delete (payload as any).razorpay_payment_id;
    delete (payload as any).razorpay_signature;
    delete (payload as any).payment_verified_at;

    // Update apex_registrations
    try {
      await supabase
        .from("apex_registrations")
        .update(payload)
        .or(`id.eq.${id},r_id.eq.${id}`);
    } catch {}

    // Update teams table
    try {
      await supabase
        .from("teams")
        .update({
          ...(team_name !== undefined && { team_name }),
          ...(leader !== undefined && { leader_name: leader }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(collegeOrg !== undefined && { college: collegeOrg }),
          ...(team_size !== undefined && { team_size: Number(team_size) }),
          ...(status !== undefined && { status }),
          ...(preferred_domain !== undefined && { preferred_domain }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {}

    const updated = updateStoredTeam(id, payload);
    return successResponse(res, updated ? normalizeRegistrationRow(updated) : { id, ...payload });
  } catch (err: any) {
    const fallback = updateStoredTeam(req.params.id, req.body);
    if (fallback) return successResponse(res, normalizeRegistrationRow(fallback));
    return errorResponse(res, err.message, 500);
  }
}

/**
 * DELETE /api/admin/teams/:id
 */
export async function deleteTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;

    try {
      await supabase
        .from("apex_registrations")
        .delete()
        .or(`id.eq.${id},r_id.eq.${id}`);
    } catch {}

    try {
      await supabase.from("teams").delete().eq("id", id);
    } catch {}

    deleteStoredTeam(id);

    return successResponse(res, { success: true });
  } catch (err: any) {
    deleteStoredTeam(req.params.id);
    return successResponse(res, { success: true });
  }
}

/**
 * GET /api/admin/settings
 */
export async function getSettings(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("event_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      return errorResponse(res, error.message, 500);
    }

    return successResponse(res, data || {});
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * POST /api/admin/settings
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const settings = req.body;

    const { data: existing } = await supabase
      .from("event_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("event_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return errorResponse(res, error.message, 500);
      return successResponse(res, data);
    } else {
      const { data, error } = await supabase
        .from("event_settings")
        .insert(settings)
        .select()
        .single();

      if (error) return errorResponse(res, error.message, 500);
      return successResponse(res, data);
    }
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * POST /api/admin/registrations/:id/send-email
 * Allows admins to trigger/resend confirmation email to a participant.
 */
export async function sendAdminTeamEmail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const force = req.query.force === "true" || req.body?.force === true;
    const result = await sendRegistrationConfirmationEmail(id, force);

    if (!result.success && result.error) {
      return errorResponse(res, result.error, 500);
    }

    return successResponse(res, result);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
}
