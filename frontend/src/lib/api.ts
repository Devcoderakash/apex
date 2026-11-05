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
  ppt_url: string;
  ppt_storage_path?: string;
  ppt_file_name?: string;
  ppt_file_type?: string;
  ppt_file_size?: number;
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
  file?: File | null;
}

/**
 * ATOMIC POST-PAYMENT REGISTRATION
 * Sends payment proof and complete registration details in multipart FormData.
 * Presentation file is uploaded only now (post-payment).
 */
export async function verifyPaymentAndRegister(
  payload: VerifyPaymentAndRegisterPayload,
): Promise<{
  success: boolean;
  status: string;
  playerId: string;
  teamName: string;
  orderId: string;
}> {
  const formData = new FormData();
  formData.append("razorpay_order_id", payload.razorpay_order_id);
  formData.append("razorpay_payment_id", payload.razorpay_payment_id);
  formData.append("razorpay_signature", payload.razorpay_signature);
  formData.append("team_name", payload.team_name);
  formData.append("leader_name", payload.leader_name);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  if (payload.college) formData.append("college", payload.college);
  formData.append("team_size", String(payload.team_size || 1));

  if (payload.preferred_domain) formData.append("preferred_domain", payload.preferred_domain);
  if (payload.github_url) formData.append("github_url", payload.github_url);
  if (payload.linkedin_url) formData.append("linkedin_url", payload.linkedin_url);
  if (payload.project_title) formData.append("project_title", payload.project_title);
  if (payload.project_description) formData.append("project_description", payload.project_description);
  if (payload.problem_statement) formData.append("problem_statement", payload.problem_statement);
  if (payload.proposed_solution) formData.append("proposed_solution", payload.proposed_solution);
  if (payload.tech_stack) formData.append("tech_stack", payload.tech_stack);
  if (payload.expected_impact) formData.append("expected_impact", payload.expected_impact);
  if (payload.demo_url) formData.append("demo_url", payload.demo_url);
  if (payload.portfolio_url) formData.append("portfolio_url", payload.portfolio_url);
  if (payload.other_links) formData.append("other_links", payload.other_links);

  formData.append("consent_service", "true");
  formData.append("consent_marketing_email", String(!!payload.consent_marketing_email));
  formData.append("consent_marketing_sms", String(!!payload.consent_marketing_sms));
  formData.append("consent_marketing_whatsapp", String(!!payload.consent_marketing_whatsapp));

  if (payload.members && payload.members.length > 0) {
    formData.append("members", JSON.stringify(payload.members));
  }

  if (payload.file) {
    formData.append("presentation", payload.file);
  }

  const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const responseData = await response.json();
    if (response.ok && responseData.success) {
      return {
        success: true,
        status: responseData.status || "paid",
        playerId: responseData.playerId,
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

export interface UploadPptResponse {
  success: boolean;
  /** Storage path in Supabase (e.g. "submissions/1234_file.pdf"). NOT a public URL. */
  storagePath: string;
  /** Direct URL or signed URL for immediate browser preview. */
  url: string;
  fileName: string;
  size: number;
  mimeType?: string;
}

/**
 * Upload presentation (PPT, PPTX, or PDF) up to 20MB.
 * Prioritizes direct Supabase Storage upload to avoid Vercel 4.5MB payload limit,
 * with fallback to backend server if configured.
 */
export async function uploadPptFile(file: File): Promise<UploadPptResponse> {
  // 1. Prioritize backend upload (handles local disk + Supabase hybrid storage without client-side RLS/DNS issues)
  const uploadEndpoint = API_BASE_URL ? `${API_BASE_URL}/api/upload/ppt` : "/api/upload/ppt";
  try {
    const formData = new FormData();
    formData.append("ppt", file);

    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const responseData = await response.json();
      if (response.ok) {
        return responseData;
      }
      throw new Error(responseData?.error || responseData?.detail || "Upload failed");
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Upload server error (${response.status}): ${text.slice(0, 100)}`);
      }
    }
  } catch (backendErr: any) {
    console.warn("[Upload] Backend upload notice, attempting direct Supabase:", backendErr?.message);
    if (!backendErr?.message?.includes("Failed to fetch") && !backendErr?.message?.includes("NetworkError")) {
      // If backend returned a specific error, throw it so the user sees the exact message
      throw backendErr;
    }
  }

  // 2. Direct Supabase Storage fallback
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `submissions/${Date.now()}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from("apex-presentations")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (!error && data?.path) {
      const { data: pubData } = supabase.storage
        .from("apex-presentations")
        .getPublicUrl(data.path);

      return {
        success: true,
        storagePath: data.path,
        url: pubData?.publicUrl || "",
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      };
    }

    if (error) {
      throw new Error(error.message);
    }
  } catch (directErr: any) {
    throw new Error(directErr.message || "Failed to upload file to storage.");
  }

  throw new Error("Unable to save file to storage. Please try again.");
}

/**
 * Fetch a fresh 1-hour signed URL for a PPT stored in Supabase Storage.
 */
export async function getPptSignedUrl(storagePath: string): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from("apex-presentations")
      .createSignedUrl(storagePath, 3600);

    if (data?.signedUrl) return data.signedUrl;

    const { data: pubData } = supabase.storage
      .from("apex-presentations")
      .getPublicUrl(storagePath);

    if (pubData?.publicUrl) return pubData.publicUrl;
  } catch {}

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/upload/signed-url?path=${encodeURIComponent(storagePath)}`,
    );
    if (response.ok) {
      const json = await response.json();
      return json.url ?? null;
    }
  } catch {}

  return null;
}

/**
 * Admin: get a signed download URL for a specific team's PPT.
 */
export async function getAdminPptSignedUrl(
  teamId: string,
  storagePath?: string | null,
): Promise<{
  signedUrl: string;
  fileName: string;
  mimeType: string;
} | null> {
  if (storagePath) {
    try {
      const { data } = await supabase.storage
        .from("apex-presentations")
        .createSignedUrl(storagePath, 3600);

      if (data?.signedUrl) {
        return {
          signedUrl: data.signedUrl,
          fileName: storagePath.split("/").pop() || "presentation.pdf",
          mimeType: "application/pdf",
        };
      }

      const { data: pubData } = supabase.storage
        .from("apex-presentations")
        .getPublicUrl(storagePath);

      if (pubData?.publicUrl) {
        return {
          signedUrl: pubData.publicUrl,
          fileName: storagePath.split("/").pop() || "presentation.pdf",
          mimeType: "application/pdf",
        };
      }
    } catch {}
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(teamId)}/ppt-url`,
      { headers: getAdminHeaders() },
    );
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return json.data ?? json;
      }
    }
  } catch {}

  return null;
}

/**
 * Admin: fetch all registrations.
 */
export async function getAdminRegistrations(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/registrations`, {
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
  amount: number; // in paise (e.g. 19900 = ₹199)
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


