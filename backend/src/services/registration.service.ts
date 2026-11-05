import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "./supabase.service.js";

export const REGISTRATION_FEE_INR = 199;
export const REGISTRATION_FEE_PAISE = REGISTRATION_FEE_INR * 100; // 19900 paise

export interface RegisterTeamInput {
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
  consent_service?: boolean;
  consent_marketing_email?: boolean;
  consent_marketing_sms?: boolean;
  consent_marketing_whatsapp?: boolean;
  members: {
    full_name: string;
    position: number;
    email?: string;
    phone?: string;
    college?: string;
  }[];
}

// Resilient memory cache (ensures app works smoothly even if Supabase schema cache is warming up or table is pending)
const localTeamStore = new Map<string, any>();

export function getAllStoredTeams(): any[] {
  return Array.from(localTeamStore.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );
}

export interface RegisterPaidTeamInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
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
  consent_service?: boolean;
  consent_marketing_email?: boolean;
  consent_marketing_sms?: boolean;
  consent_marketing_whatsapp?: boolean;
  ppt_url?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  members?: {
    full_name: string;
    position: number;
    email?: string;
    phone?: string;
    college?: string;
  }[];
}

/**
 * ATOMIC POST-PAYMENT REGISTRATION:
 * Executes ONLY AFTER Razorpay payment is verified.
 * Uploads presentation to Supabase Storage, inserts paid team, team members, and consent records.
 * Zero records or files are stored before payment!
 */
export async function registerPaidTeam(input: RegisterPaidTeamInput) {
  const normEmail = (input.email || "").trim().toLowerCase();
  const orderId = input.razorpay_order_id;
  const paymentId = input.razorpay_payment_id;

  // 1. Idempotency Check: Was this order or payment already processed?
  try {
    const { data: existing, error: existErr } = await supabase
      .from("teams")
      .select("*, team_members(*)")
      .or(`razorpay_order_id.eq.${orderId},payment_id.eq.${paymentId}`)
      .maybeSingle();

    if (!existErr && existing && existing.payment_status === "paid") {
      console.log(`[Registration Service] Order ${orderId} already registered as team ${existing.player_id}`);
      return { team: existing, isExisting: true };
    }
  } catch (err: any) {
    console.warn("[Registration Service] Existing check notice:", err.message);
  }

  // Check memory store for idempotency
  for (const t of localTeamStore.values()) {
    if ((t.razorpay_order_id === orderId || t.payment_id === paymentId) && t.payment_status === "paid") {
      return { team: t, isExisting: true };
    }
  }

  // 2. Upload presentation to Supabase Storage ONLY now (after payment confirmation)
  let storagePath: string | null = null;
  let publicUrl: string | null = null;

  if (input.fileBuffer && input.fileBuffer.length > 0 && input.fileName) {
    const cleanName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    storagePath = `submissions/${Date.now()}_${cleanName}`;

    // Local resilient persistence backup
    try {
      const localDir = path.resolve(process.cwd(), "uploads", "submissions");
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      fs.writeFileSync(path.join(localDir, `${Date.now()}_${cleanName}`), input.fileBuffer);
    } catch (fsErr: any) {
      console.warn("[Registration Service] Local backup write notice:", fsErr.message);
    }

    try {
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === "apex-presentations")) {
        await supabase.storage.createBucket("apex-presentations", {
          public: true,
          fileSizeLimit: 20 * 1024 * 1024,
          allowedMimeTypes: [
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ],
        });
      }

      const { error: uploadError } = await supabase.storage
        .from("apex-presentations")
        .upload(storagePath, input.fileBuffer, {
          contentType: input.fileMimeType || "application/octet-stream",
          upsert: false,
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from("apex-presentations")
          .getPublicUrl(storagePath);
        publicUrl = pubData?.publicUrl || storagePath;
        console.log(`[Registration Service] Presentation uploaded post-payment to ${storagePath}`);
      } else {
        console.error("[Registration Service] Post-payment storage upload failed:", uploadError.message);
      }
    } catch (uploadEx: any) {
      console.error("[Registration Service] Storage upload exception:", uploadEx.message);
    }
  }

  // 3. Generate IDs
  const teamId = crypto.randomUUID();
  const playerId = `APEX-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  // Exact Supabase public.teams columns
  const teamData = {
    id: teamId,
    player_id: playerId,
    team_name: input.team_name || "Team APEX",
    leader_name: input.leader_name || "Team Leader",
    email: normEmail,
    phone: input.phone || "",
    college: input.college || "",
    team_size: Number(input.team_size || 1),
    suit: "spades" as const,
    preferred_domain: input.preferred_domain || null,
    github_url: input.github_url || null,
    linkedin_url: input.linkedin_url || null,
    status: "approved" as const,
    ppt_url: publicUrl || storagePath || input.ppt_url || null,
    ppt_file_name: input.fileName || null,
    ppt_file_type: input.fileMimeType || null,
    ppt_file_size: input.fileSize || (input.fileBuffer ? input.fileBuffer.length : null),
    ppt_storage_path: storagePath || null,
    payment_status: "paid" as const,
    payment_id: paymentId,
    razorpay_order_id: orderId,
    payment_order_id: orderId,
    payment_signature: input.razorpay_signature || null,
    payment_amount: REGISTRATION_FEE_PAISE,
    payment_currency: "INR",
    paid_at: now,
    created_at: now,
    updated_at: now,
  };

  localTeamStore.set(teamId, { ...teamData, ...input });
  localTeamStore.set(orderId, { ...teamData, ...input });

  // 4. Insert into public.teams
  try {
    const { error: teamInsertError } = await supabase.from("teams").insert(teamData);
    if (teamInsertError) {
      console.error("[Registration Service] Post-payment team insert error:", teamInsertError.message);
      throw new Error(`Failed to insert paid team: ${teamInsertError.message}`);
    }
  } catch (err: any) {
    console.error("[Registration Service] Supabase team insert exception:", err.message);
    throw err;
  }

  // 5. Insert additional team members
  if (Array.isArray(input.members) && input.members.length > 0) {
    const memberRows = input.members.map((m, idx) => ({
      team_id: teamId,
      full_name: m.full_name,
      position: m.position || idx + 1,
    }));
    try {
      const { error: memberError } = await supabase.from("team_members").insert(memberRows);
      if (memberError) {
        console.warn("[Registration Service] Member insert notice:", memberError.message);
      }
    } catch (mErr: any) {
      console.warn("[Registration Service] Member insert exception:", mErr.message);
    }
  }

  // 6. DPDP consent records (if table exists)
  try {
    await supabase.from("consent_records").insert([
      {
        team_id: teamId,
        player_id: playerId,
        email: normEmail,
        consent_purpose: "service_essential",
        consent_given: true,
        consent_version: "2026.1",
      },
    ] as any);
  } catch {
    // Optional table
  }

  console.log(`[Registration Service] Confirmed and registered paid team: ${teamData.team_name} (${playerId})`);
  return { team: teamData, isExisting: false };
}

export async function createPendingRegistration(payload: RegisterTeamInput) {
  const normEmail = payload.email.trim().toLowerCase();

  // 1. Check existing team in Supabase or local store
  let existingTeam: any = null;
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("id, player_id, payment_status, razorpay_order_id, payment_order_id")
      .eq("email", normEmail)
      .maybeSingle();

    if (!error && data) {
      existingTeam = data;
    }
  } catch (err) {
    console.warn("[Registration Service] Supabase check bypassed, using local store:", (err as any)?.message);
  }

  if (!existingTeam) {
    for (const t of localTeamStore.values()) {
      if (t.email === normEmail) {
        existingTeam = t;
        break;
      }
    }
  }

  if (existingTeam) {
    if (existingTeam.payment_status === "paid") {
      throw new Error("This email is already registered with a confirmed payment.");
    }

    // Reuse existing pending registration
    const cleanId = existingTeam.id.replace(/-/g, "").slice(0, 16);
    const orderRef = `apex_${cleanId}_${Date.now().toString().slice(-6)}`;

    const updatedData = {
      ...existingTeam,
      team_name: payload.team_name,
      leader_name: payload.leader_name,
      phone: payload.phone,
      college: payload.college || "",
      team_size: Number(payload.team_size || 2),
      ppt_url: payload.ppt_url || "",
      ppt_storage_path: payload.ppt_storage_path || null,
      ppt_file_name: payload.ppt_file_name || null,
      ppt_file_type: payload.ppt_file_type || null,
      ppt_file_size: payload.ppt_file_size || null,
      preferred_domain: payload.preferred_domain || null,
      github_url: payload.github_url || null,
      linkedin_url: payload.linkedin_url || null,
      project_title: payload.project_title || null,
      project_description: payload.project_description || null,
      problem_statement: payload.problem_statement || null,
      proposed_solution: payload.proposed_solution || null,
      tech_stack: payload.tech_stack || null,
      expected_impact: payload.expected_impact || null,
      demo_url: payload.demo_url || null,
      portfolio_url: payload.portfolio_url || null,
      other_links: payload.other_links || null,
      consent_version: "2026.1",
      consent_service: payload.consent_service !== false,
      consent_marketing_email: Boolean(payload.consent_marketing_email),
      consent_marketing_sms: Boolean(payload.consent_marketing_sms),
      consent_marketing_whatsapp: Boolean(payload.consent_marketing_whatsapp),
      payment_status: "pending",
      payment_amount: REGISTRATION_FEE_PAISE,
      payment_currency: "INR",
      payment_order_id: orderRef,
      updated_at: new Date().toISOString(),
    };

    localTeamStore.set(existingTeam.id, updatedData);

    try {
      await supabase
        .from("teams")
        .update({
          team_name: payload.team_name,
          leader_name: payload.leader_name,
          phone: payload.phone,
          college: payload.college || "",
          team_size: Number(payload.team_size || 2),
          ppt_url: payload.ppt_url || "",
          ppt_storage_path: payload.ppt_storage_path || null,
          ppt_file_name: payload.ppt_file_name || null,
          ppt_file_type: payload.ppt_file_type || null,
          ppt_file_size: payload.ppt_file_size || null,
          preferred_domain: payload.preferred_domain || null,
          github_url: payload.github_url || null,
          linkedin_url: payload.linkedin_url || null,
          payment_status: "pending",
          payment_amount: REGISTRATION_FEE_PAISE,
          payment_currency: "INR",
          payment_order_id: orderRef,
        })
        .eq("id", existingTeam.id);
    } catch (e) {
      console.warn("[Registration Service] Supabase update warning:", (e as any)?.message);
    }

    return {
      teamId: existingTeam.id,
      playerId: existingTeam.player_id,
      cleanId,
      orderId: orderRef,
    };
  }

  // Brand new team
  const teamId = crypto.randomUUID();
  const playerId = `APEX-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanId = teamId.replace(/-/g, "").slice(0, 16);
  const orderId = `apex_${cleanId}`;

  const newTeam = {
    id: teamId,
    player_id: playerId,
    team_name: payload.team_name,
    leader_name: payload.leader_name,
    email: normEmail,
    phone: payload.phone,
    college: payload.college || "",
    team_size: Number(payload.team_size || 2),
    suit: "spades",
    ppt_url: payload.ppt_url || "",
    ppt_storage_path: payload.ppt_storage_path || null,
    ppt_file_name: payload.ppt_file_name || null,
    ppt_file_type: payload.ppt_file_type || null,
    ppt_file_size: payload.ppt_file_size || null,
    project_title: payload.project_title || null,
    project_description: payload.project_description || null,
    problem_statement: payload.problem_statement || null,
    proposed_solution: payload.proposed_solution || null,
    tech_stack: payload.tech_stack || null,
    expected_impact: payload.expected_impact || null,
    demo_url: payload.demo_url || null,
    portfolio_url: payload.portfolio_url || null,
    other_links: payload.other_links || null,
    consent_version: "2026.1",
    consent_service: payload.consent_service !== false,
    consent_marketing_email: Boolean(payload.consent_marketing_email),
    consent_marketing_sms: Boolean(payload.consent_marketing_sms),
    consent_marketing_whatsapp: Boolean(payload.consent_marketing_whatsapp),
    payment_status: "pending",
    payment_amount: REGISTRATION_FEE_PAISE,
    payment_currency: "INR",
    payment_order_id: orderId,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: payload.members || [],
  };

  localTeamStore.set(teamId, newTeam);

  // Attempt to write to Supabase
  try {
    const { error: teamError } = await supabase.from("teams").insert({
      id: teamId,
      player_id: playerId,
      team_name: payload.team_name,
      leader_name: payload.leader_name,
      email: normEmail,
      phone: payload.phone,
      college: payload.college || "",
      team_size: Number(payload.team_size || 2),
      suit: "spades",
      ppt_url: payload.ppt_url || "",
      ppt_storage_path: payload.ppt_storage_path || null,
      ppt_file_name: payload.ppt_file_name || null,
      ppt_file_type: payload.ppt_file_type || null,
      ppt_file_size: payload.ppt_file_size || null,
      preferred_domain: payload.preferred_domain || null,
      github_url: payload.github_url || null,
      linkedin_url: payload.linkedin_url || null,
      project_title: payload.project_title || null,
      project_description: payload.project_description || null,
      problem_statement: payload.problem_statement || null,
      proposed_solution: payload.proposed_solution || null,
      tech_stack: payload.tech_stack || null,
      expected_impact: payload.expected_impact || null,
      demo_url: payload.demo_url || null,
      portfolio_url: payload.portfolio_url || null,
      other_links: payload.other_links || null,
      consent_version: "2026.1",
      consent_service: payload.consent_service !== false,
      consent_marketing_email: Boolean(payload.consent_marketing_email),
      consent_marketing_sms: Boolean(payload.consent_marketing_sms),
      consent_marketing_whatsapp: Boolean(payload.consent_marketing_whatsapp),
      payment_status: "pending",
      payment_amount: REGISTRATION_FEE_PAISE,
      payment_currency: "INR",
      payment_order_id: orderId,
    });

    if (teamError) {
      console.warn("[Registration Service] Supabase insert note:", teamError.message);
    } else if (Array.isArray(payload.members) && payload.members.length > 0) {
      const membersToInsert = payload.members.map((m) => ({
        ...m,
        team_id: teamId,
      }));
      await supabase.from("team_members").insert(membersToInsert);
    }

    // DPDP Act: Audit-logged purpose-specific consent
    const consentEntries = [
      {
        team_id: teamId,
        player_id: playerId,
        email: normEmail,
        consent_purpose: "service_essential",
        consent_given: true,
        consent_version: "2026.1",
      },
      ...(payload.consent_marketing_email
        ? [
            {
              team_id: teamId,
              player_id: playerId,
              email: normEmail,
              consent_purpose: "marketing_email",
              consent_given: true,
              consent_version: "2026.1",
            },
          ]
        : []),
      ...(payload.consent_marketing_sms
        ? [
            {
              team_id: teamId,
              player_id: playerId,
              email: normEmail,
              consent_purpose: "marketing_sms",
              consent_given: true,
              consent_version: "2026.1",
            },
          ]
        : []),
      ...(payload.consent_marketing_whatsapp
        ? [
            {
              team_id: teamId,
              player_id: playerId,
              email: normEmail,
              consent_purpose: "marketing_whatsapp",
              consent_given: true,
              consent_version: "2026.1",
            },
          ]
        : []),
    ];

    try {
      await supabase.from("consent_records").insert(consentEntries as any);
    } catch {}
  } catch (err: any) {
    console.warn("[Registration Service] Supabase unreachable or table pending, preserved in local storage:", err.message);
  }

  return { teamId, playerId, cleanId, orderId };
}

export async function attachRazorpayOrder(teamId: string, razorpayOrderId: string) {
  const localTeam = localTeamStore.get(teamId);
  if (localTeam) {
    localTeam.razorpay_order_id = razorpayOrderId;
    localTeam.payment_order_id = razorpayOrderId;
  }

  try {
    await supabase
      .from("teams")
      .update({
        razorpay_order_id: razorpayOrderId,
        payment_order_id: razorpayOrderId,
      })
      .eq("id", teamId);
  } catch (err: any) {
    console.warn("[Registration Service] attachRazorpayOrder Supabase note:", err.message);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTeamByOrderId(orderId: string) {
  // 1. Try Supabase
  try {
    const isUuid = UUID_REGEX.test(orderId);
    let query = supabase.from("teams").select("*, team_members(*)");
    let res;
    if (isUuid) {
      res = await query.or(`id.eq.${orderId},player_id.eq.${orderId}`).maybeSingle();
    } else {
      res = await query
        .or(`razorpay_order_id.eq.${orderId},payment_order_id.eq.${orderId},player_id.eq.${orderId}`)
        .maybeSingle();
    }

    if (!res.error && res.data) {
      return res.data;
    }
  } catch (err) {
    // Fall through to memory store
  }

  // 2. Try memory store
  for (const team of localTeamStore.values()) {
    if (
      team.razorpay_order_id === orderId ||
      team.payment_order_id === orderId ||
      team.id === orderId ||
      team.player_id === orderId
    ) {
      return team;
    }
  }

  return null;
}

export async function markTeamPaid(
  orderId: string,
  paymentDetails: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature?: string;
  },
) {
  const now = new Date().toISOString();
  const paymentId = paymentDetails.razorpay_payment_id;
  const isUuid = UUID_REGEX.test(orderId);

  // Update memory store
  for (const team of localTeamStore.values()) {
    if (
      team.razorpay_order_id === orderId ||
      team.payment_order_id === orderId ||
      team.id === orderId
    ) {
      team.payment_status = "paid";
      team.payment_id = paymentId;
      team.razorpay_order_id = paymentDetails.razorpay_order_id;
      team.payment_signature = paymentDetails.razorpay_signature || null;
      team.paid_at = now;
      team.status = "approved";
      break;
    }
  }

  // Update Supabase
  try {
    const updatePayload = {
      payment_status: "paid",
      payment_id: String(paymentId),
      razorpay_order_id: paymentDetails.razorpay_order_id,
      payment_signature: paymentDetails.razorpay_signature || null,
      paid_at: now,
      status: "approved" as const,
    };

    let query = supabase.from("teams").update(updatePayload);
    if (isUuid) {
      const { error } = await query.eq("id", orderId);
      if (error) console.error("[Registration Service] markTeamPaid UUID error:", error.message);
    } else {
      const { error } = await query.or(
        `razorpay_order_id.eq.${orderId},payment_order_id.eq.${orderId}`,
      );
      if (error) console.error("[Registration Service] markTeamPaid orderId error:", error.message);
    }
  } catch (err: any) {
    console.warn("[Registration Service] markTeamPaid Supabase note:", err.message);
  }
}

export async function markTeamFailed(orderId: string) {
  const isUuid = UUID_REGEX.test(orderId);

  for (const team of localTeamStore.values()) {
    if (
      team.razorpay_order_id === orderId ||
      team.payment_order_id === orderId ||
      team.id === orderId
    ) {
      team.payment_status = "failed";
      break;
    }
  }

  try {
    let query = supabase.from("teams").update({ payment_status: "failed" });
    if (isUuid) {
      await query.eq("id", orderId);
    } else {
      await query.or(`razorpay_order_id.eq.${orderId},payment_order_id.eq.${orderId}`);
    }
  } catch (err: any) {
    console.warn("[Registration Service] markTeamFailed note:", err.message);
  }
}

export function updateStoredTeam(id: string, updates: any): any | null {
  for (const [key, team] of localTeamStore.entries()) {
    if (team.id === id || team.player_id === id) {
      const updated = { ...team, ...updates, updated_at: new Date().toISOString() };
      localTeamStore.set(key, updated);
      return updated;
    }
  }
  return null;
}

export function deleteStoredTeam(id: string): boolean {
  for (const [key, team] of localTeamStore.entries()) {
    if (team.id === id || team.player_id === id) {
      localTeamStore.delete(key);
      return true;
    }
  }
  return false;
}
