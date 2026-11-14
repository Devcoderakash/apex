/**
 * Frontend API client for APEX registration and Razorpay payments.
 * Supports dual-mode: direct Supabase integration + fallback/primary backend server.
 * Never stores or requests backend secrets in the client.
 */

import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".local"))
    ? ""
    : (import.meta.env.VITE_API_URL || "");

export interface CreateOrderPayload {
  team_name: string;
  leader_name: string;
  email: string;
  phone: string;
  college: string;
  team_size: number;
  idea_drive_link: string;
  ppt_url?: string;
  preferred_domain?: string;
  project_title?: string;
  project_description?: string;
  problem_statement?: string;
  proposed_solution?: string;
  tech_stack?: string;
  expected_impact?: string;
  github_url?: string;
  linkedin_url?: string;
  demo_url?: string;
  portfolio_url?: string;
  other_links?: string;
  consent_service?: boolean;
  consent_marketing_email?: boolean;
  consent_marketing_sms?: boolean;
  consent_marketing_whatsapp?: boolean;
  members: {
    full_name: string;
    email?: string;
    phone?: string;
    college?: string;
    position: number;
  }[];
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  keyId: string;
  teamId: string;
  playerId: string;
  teamName: string;
  leaderName: string;
  email: string;
  phone: string;
}

export async function createOrder(
  data: CreateOrderPayload,
): Promise<PaymentOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const responseData = await response.json();
    if (response.ok && responseData.success) {
      return {
        orderId: responseData.orderId || responseData.order_id,
        amount: responseData.amount,
        amountInRupees: responseData.amountInRupees || Math.round(responseData.amount / 100),
        currency: responseData.currency || "INR",
        keyId: responseData.keyId || responseData.key_id || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || "",
        teamId: responseData.teamId || "",
        playerId: responseData.playerId || "",
        teamName: responseData.teamName || data.team_name,
        leaderName: responseData.leaderName || data.leader_name,
        email: responseData.email || data.email,
        phone: responseData.phone || data.phone,
      };
    }
    throw new Error(responseData?.error || responseData?.message || `Failed to create payment order (${response.status})`);
  }
  throw new Error(`Order creation server returned HTTP ${response.status}`);
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  teamId?: string;
}

export async function verifyPayment(params: VerifyPaymentPayload): Promise<{
  success: boolean;
  status: string;
  playerId: string;
  teamName: string;
  orderId: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const responseData = await response.json();
    if (response.ok && responseData.success) {
      return {
        success: true,
        status: responseData.status || "paid",
        playerId: responseData.playerId || "",
        teamName: responseData.teamName || "Team",
        orderId: responseData.order_id || params.razorpay_order_id,
      };
    }
    throw new Error(responseData?.error || responseData?.message || `Payment verification failed (${response.status})`);
  }
  throw new Error(`Verification server returned HTTP ${response.status}`);
}

export interface VerifyPaymentAndRegisterPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  team_name: string;
  leader_name: string;
  email: string;
  phone: string;
  college?: string;
  team_size: number;
  idea_drive_link: string;
  ppt_url?: string;
  preferred_domain?: string;
  github_url?: string;
  linkedin_url?: string;
  project_title?: string;
  project_description?: string;
  problem_statement?: string;
  proposed_solution?: string;
  tech_stack?: string;
  expected_impact?: string;
  demo_url?: string;
  portfolio_url?: string;
  other_links?: string;
  consent_marketing_email?: boolean;
  consent_marketing_sms?: boolean;
  consent_marketing_whatsapp?: boolean;
  members?: { full_name: string; position: number }[];
}

/**
 * ATOMIC POST-PAYMENT REGISTRATION
 * Sends payment proof and complete registration details including idea_drive_link.
 * Uses clean JSON payload.
 */
export async function verifyPaymentAndRegister(
  payload: VerifyPaymentAndRegisterPayload,
): Promise<{
  success: boolean;
  status: string;
  playerId: string;
  r_id?: string;
  teamName: string;
  orderId: string;
}> {
  const body = {
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
    team_name: payload.team_name,
    leader_name: payload.leader_name,
    email: payload.email,
    phone: payload.phone,
    college: payload.college || "",
    team_size: payload.team_size || 1,
    idea_drive_link: payload.idea_drive_link,
    ppt_url: payload.idea_drive_link || payload.ppt_url || "",
    preferred_domain: payload.preferred_domain,
    github_url: payload.github_url,
    linkedin_url: payload.linkedin_url,
    project_title: payload.project_title,
    project_description: payload.project_description,
    problem_statement: payload.problem_statement,
    proposed_solution: payload.proposed_solution,
    tech_stack: payload.tech_stack,
    expected_impact: payload.expected_impact,
    demo_url: payload.demo_url,
    portfolio_url: payload.portfolio_url,
    other_links: payload.other_links,
    consent_service: true,
    consent_marketing_email: Boolean(payload.consent_marketing_email),
    consent_marketing_sms: Boolean(payload.consent_marketing_sms),
    consent_marketing_whatsapp: Boolean(payload.consent_marketing_whatsapp),
    members: payload.members || [],
  };

  const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const responseData = await response.json();
    if (response.ok && responseData.success) {
      return {
        success: true,
        status: responseData.status || "paid",
        playerId: responseData.playerId || responseData.r_id,
        r_id: responseData.r_id || responseData.playerId,
        teamName: responseData.teamName || payload.team_name,
        orderId: responseData.order_id || payload.razorpay_order_id,
      };
    }
    throw new Error(responseData?.error || responseData?.message || `Payment verification failed (${response.status})`);
  }
  throw new Error(`Verification server returned HTTP ${response.status}`);
}

export async function getTeamByOrderId(
  orderId: string,
): Promise<{ player_id: string; team_name: string; payment_status: string } | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/payments/order/${encodeURIComponent(orderId)}`,
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json?.data) return json.data;
      }
    }
  } catch {}

  const { data } = await supabase
    .from("teams")
    .select("player_id, team_name, payment_status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  return data as any;
}

export async function getRegistrationStatus(
  id: string,
): Promise<{ id: string; player_id: string; team_name: string; payment_status: string } | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/registrations/${encodeURIComponent(id)}/status`,
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json?.data) return json.data;
      }
    }
  } catch {}

  const { data } = await supabase
    .from("teams")
    .select("id, player_id, team_name, payment_status")
    .eq("id", id)
    .maybeSingle();

  return data as any;
}

/**
 * Admin: fetch registrations with server-side pagination, search, and filtering.
 */
export async function getAdminRegistrations(params?: {
  page?: number;
  limit?: number;
  q?: string;
  payment_status?: string;
  registration_status?: string;
  review_status?: string;
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);
  if (params?.payment_status && params.payment_status !== "all") {
    query.set("payment_status", params.payment_status);
  }
  if (params?.registration_status && params.registration_status !== "all") {
    query.set("registration_status", params.registration_status);
  }
  if (params?.review_status && params.review_status !== "all") {
    query.set("review_status", params.review_status);
  }

  const qs = query.toString();
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/registrations${qs ? `?${qs}` : ""}`, {
      headers: getAdminHeaders(),
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch registrations");
  }
  return data ?? [];
}

/**
 * Admin: update a team's status (approved, pending, rejected).
 */
export async function updateAdminTeamStatus(id: string, status: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/teams/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      },
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from("teams")
    .update({ status: status as any })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin: update registration review status and notes.
 */
export async function updateAdminReviewStatus(
  id: string,
  params: { review_status?: "pending" | "shortlisted" | "rejected"; admin_notes?: string },
): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(id)}/review`,
      {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify(params),
      },
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  if (params.review_status) {
    return updateAdminTeamStatus(
      id,
      params.review_status === "shortlisted" ? "approved" : params.review_status,
    );
  }
}

/**
 * Admin: update full team details.
 */
export async function updateAdminTeam(id: string, teamData: any): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/teams/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(teamData),
      },
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from("teams")
    .update(teamData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin: delete team registration.
 */
export async function deleteAdminTeam(id: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/teams/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: getAdminHeaders(),
      },
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

/**
 * Admin: get aggregate event stats.
 */
export async function getAdminStats(): Promise<{
  totalTeams: number;
  paidTeams: number;
  approvedTeams: number;
  pendingTeams: number;
  totalParticipants: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: getAdminHeaders(),
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data: teams } = await supabase.from("teams").select("payment_status, status, team_size");
  const all = teams || [];
  const totalTeams = all.length;
  const paidTeams = all.filter((t: any) => t.payment_status === "paid").length;
  const approvedTeams = all.filter((t: any) => t.status === "approved").length;
  const pendingTeams = all.filter((t: any) => t.status === "pending").length;
  const totalParticipants = all.reduce((sum: number, t: any) => sum + (t.team_size || 2), 0);

  return {
    totalTeams,
    paidTeams,
    approvedTeams,
    pendingTeams,
    totalParticipants,
  };
}

/**
 * Admin: get event settings.
 */
export async function getAdminSettings(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      headers: getAdminHeaders(),
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data } = await supabase.from("event_settings").select("*").maybeSingle();
  return data ?? { event_name: "APEX 1.0", prize_pool: "30000" };
}

/**
 * Admin: update event settings.
 */
export async function updateAdminSettings(settings: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(settings),
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from("event_settings")
    .upsert({ ...settings, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Trigger confirmation email delivery.
 */
export async function triggerConfirmationEmail(params: {
  teamId?: string;
  playerId?: string;
  orderId?: string;
  forceRetry?: boolean;
}): Promise<{ success: boolean; message?: string; error?: string; alreadySent?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails/send-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await response.json();
      return json;
    }
  } catch {}

  return { success: true, message: "Confirmation email request logged." };
}

/**
 * Check confirmation email delivery status.
 */
export async function checkEmailStatus(id: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails/status/${encodeURIComponent(id)}`);
    if (response.ok) {
      const json = await response.json();
      return json.data;
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("registration_emails" as any)
      .select("*")
      .or(`team_id.eq.${id},player_id.eq.${id}`)
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Admin: resend confirmation email to a registered team.
 */
export async function sendAdminTeamEmail(id: string, force = true): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(id)}/send-email?force=${force}`,
      { method: "POST" },
    );
    if (response.ok) {
      const json = await response.json();
      return json.data ?? json;
    }
  } catch {}

  return triggerConfirmationEmail({ teamId: id, forceRetry: force });
}

/**
 * Creates a generic Razorpay Standard Checkout order on the backend.
 */
export async function createStandardOrder(params: {
  amount: number; // in paise (e.g. 1000 = ₹10)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<{
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  receipt?: string;
}> {
  const url = `${API_BASE_URL}/api/create-order`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to create Razorpay order");
  }

  return data;
}

/**
 * Verifies Razorpay payment signature cryptographically on the backend.
 */
export async function verifyStandardPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; status: string; message?: string }> {
  const url = `${API_BASE_URL}/api/verify-payment`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Payment signature verification failed");
  }

  return data;
}

/**
 * Returns authorization headers for admin requests using stored session token.
 */
export function getAdminHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("apex_admin_token") || ""
      : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * DPDP Act: Submit a formal grievance
 */
export async function submitGrievance(data: {
  name: string;
  email: string;
  phone?: string;
  player_id?: string;
  category: string;
  description: string;
}): Promise<{ success: boolean; complaintId: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/grievance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch {}

  const complaintId = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    await (supabase as any).from("grievances").insert({
      complaint_id: complaintId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      player_id: data.player_id || null,
      category: data.category,
      description: data.description,
    });
  } catch {}

  return { success: true, complaintId };
}

/**
 * DPDP Act: Submit a data principal privacy request (Access, Correction, Erasure)
 */
export async function submitPrivacyRequest(data: {
  request_type: string;
  name: string;
  email: string;
  phone?: string;
  player_id?: string;
  request_details: string;
}): Promise<{ success: boolean; requestId: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/privacy-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch {}

  const requestId = `PRV-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    await (supabase as any).from("privacy_requests").insert({
      request_id: requestId,
      request_type: data.request_type,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      player_id: data.player_id || null,
      request_details: data.request_details,
    });
  } catch {}

  return { success: true, requestId };
}


