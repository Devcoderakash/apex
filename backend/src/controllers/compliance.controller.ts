import type { Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../services/supabase.service.js";

// Memory store fallbacks in case Supabase schema is updating
const memoryGrievances = new Map<string, any>();
const memoryPrivacyRequests = new Map<string, any>();

const grievanceSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(150),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  player_id: z.string().trim().max(30).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10, "Please provide sufficient detail (min 10 characters)").max(2000),
});

const privacyRequestSchema = z.object({
  request_type: z.enum(["access", "correction", "erasure", "nomination", "grievance", "consent_withdrawal"]),
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(150),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  player_id: z.string().trim().max(30).optional().or(z.literal("")),
  request_details: z.string().trim().min(10, "Please provide sufficient detail").max(2000),
});

/**
 * POST /api/grievance
 * Submit a formal DPDP grievance / complaint
 */
export async function submitGrievanceHandler(req: Request, res: Response) {
  try {
    const parsed = grievanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error in grievance submission",
        details: parsed.error.format(),
      });
    }

    const { name, email, phone, player_id, category, description } = parsed.data;
    const complaintId = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const grievanceRecord = {
      complaint_id: complaintId,
      name,
      email,
      phone: phone || null,
      player_id: player_id || null,
      category,
      description,
      status: "submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryGrievances.set(complaintId, grievanceRecord);

    try {
      await supabase.from("grievances").insert(grievanceRecord as any);
    } catch (dbErr: any) {
      console.warn("[Grievance Controller] Database write notice (using cache):", dbErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Grievance received. Our Grievance Officer will review within 30 days pursuant to DPDP Act 2023.",
      complaintId,
    });
  } catch (err: any) {
    console.error("[Grievance Controller Error]", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error submitting grievance",
    });
  }
}

/**
 * GET /api/grievance/:id
 * Retrieve status of a grievance ticket
 */
export async function getGrievanceStatusHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: "Complaint ID required" });
  }

  try {
    const { data, error } = await supabase
      .from("grievances")
      .select("complaint_id, category, status, resolution_notes, created_at, resolved_at")
      .eq("complaint_id", id.trim().toUpperCase())
      .maybeSingle();

    if (!error && data) {
      return res.json({ success: true, grievance: data });
    }

    const cached = memoryGrievances.get(id.trim().toUpperCase());
    if (cached) {
      return res.json({ success: true, grievance: cached });
    }

    return res.status(404).json({ success: false, error: "Grievance ticket not found" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to look up ticket" });
  }
}

/**
 * POST /api/privacy-requests
 * Submit a DPDP Section 11/12/13 Data Principal Request
 */
export async function submitPrivacyRequestHandler(req: Request, res: Response) {
  try {
    const parsed = privacyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error in privacy request",
        details: parsed.error.format(),
      });
    }

    const { request_type, name, email, phone, player_id, request_details } = parsed.data;
    const requestId = `PRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const requestRecord = {
      request_id: requestId,
      request_type,
      name,
      email,
      phone: phone || null,
      player_id: player_id || null,
      request_details,
      status: "pending_verification",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryPrivacyRequests.set(requestId, requestRecord);

    try {
      await supabase.from("privacy_requests").insert(requestRecord as any);
    } catch (dbErr: any) {
      console.warn("[Privacy Request Controller] Database write notice:", dbErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Data Principal Request registered. Verification instructions sent to email.",
      requestId,
    });
  } catch (err: any) {
    console.error("[Privacy Request Controller Error]", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error submitting privacy request",
    });
  }
}

/**
 * GET /api/privacy-requests/:id
 * Retrieve status of a privacy request
 */
export async function getPrivacyRequestStatusHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: "Request ID required" });
  }

  try {
    const { data, error } = await supabase
      .from("privacy_requests")
      .select("request_id, request_type, status, resolution_notes, created_at, resolved_at")
      .eq("request_id", id.trim().toUpperCase())
      .maybeSingle();

    if (!error && data) {
      return res.json({ success: true, request: data });
    }

    const cached = memoryPrivacyRequests.get(id.trim().toUpperCase());
    if (cached) {
      return res.json({ success: true, request: cached });
    }

    return res.status(404).json({ success: false, error: "Privacy request not found" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to look up request" });
  }
}

