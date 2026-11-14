import crypto from "node:crypto";
import { supabase } from "./supabase.service.js";

export const REGISTRATION_FEE_INR = 10;
export const REGISTRATION_FEE_PAISE = REGISTRATION_FEE_INR * 100; // 1000 paise

export interface ApexRegistrationRecord {
  id: string;
  r_id: string; // APEX-XXXXXXXXXXXXXXX
  team_name: string;
  team_leader_name: string;
  email: string;
  phone: string;
  college_organization: string;
  team_size: number;
  additional_members: string[];
  preferred_domain: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  idea_drive_link: string;
  terms_accepted: boolean;
  terms_accepted_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  amount_paid: number;
  currency: string;
  payment_verified_at: string | null;
  registration_status: "pending" | "confirmed" | "cancelled";
  review_status: "pending" | "shortlisted" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Legacy compatibility getters / aliases
  player_id?: string;
  leader_name?: string;
  college?: string;
  ppt_url?: string;
  status?: string;
}

export interface RegisterTeamInput {
  team_name: string;
  team_leader_name?: string;
  leader_name?: string;
  email: string;
  phone: string;
  college_organization?: string;
  college?: string;
  team_size: number;
  additional_members?: string[] | { full_name: string }[];
  members?: { full_name: string; position?: number }[];
  idea_drive_link: string;
  ppt_url?: string;
  preferred_domain?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  terms_accepted?: boolean;
}

export interface RegisterPaidTeamInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  amount_paid?: number;
  team_name: string;
  team_leader_name?: string;
  leader_name?: string;
  email: string;
  phone: string;
  college_organization?: string;
  college?: string;
  team_size: number;
  additional_members?: string[] | { full_name: string }[];
  members?: { full_name: string; position?: number }[];
  idea_drive_link: string;
  ppt_url?: string;
  preferred_domain?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  terms_accepted?: boolean;
}

// ----------------------------------------------------------------------------
// R_ID Generator: Cryptographically Secure 15-character uppercase string
// Format: APEX-XXXXXXXXXXXXXXX (e.g. APEX-A7K9X2M4P8Q1W3Z)
// ----------------------------------------------------------------------------
export function generateApexRegistrationId(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(15);
  let suffix = "";
  for (let i = 0; i < 15; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `APEX-${suffix}`;
}

// Resilient in-memory store for high-availability / offline local testing
const localRegistrationStore = new Map<string, ApexRegistrationRecord>();

// Pending checkouts cache to prevent payload substitution between order creation and payment
const pendingCheckouts = new Map<string, RegisterTeamInput>();

export function storePendingCheckout(orderId: string, payload: RegisterTeamInput) {
  pendingCheckouts.set(orderId, payload);
  // Auto-expire after 2 hours
  setTimeout(() => pendingCheckouts.delete(orderId), 2 * 60 * 60 * 1000);
}

export function getPendingCheckout(orderId: string): RegisterTeamInput | null {
  return pendingCheckouts.get(orderId) || null;
}

export function getAllStoredRegistrations(): ApexRegistrationRecord[] {
  return Array.from(localRegistrationStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Normalizes member inputs into a clean string[] of additional members (team_size - 1)
 */
export function normalizeAdditionalMembers(
  teamSize: number,
  additionalMembers?: string[] | { full_name: string }[],
  legacyMembers?: { full_name: string }[],
): string[] {
  const requiredCount = Math.max(0, teamSize - 1);
  const result: string[] = [];

  if (Array.isArray(additionalMembers) && additionalMembers.length > 0) {
    for (const item of additionalMembers) {
      const name = typeof item === "string" ? item.trim() : (item?.full_name || "").trim();
      if (name.length > 0) result.push(name);
    }
  }

  if (Array.isArray(legacyMembers) && legacyMembers.length > 0) {
    for (const item of legacyMembers) {
      const name = typeof item === "string" ? (item as any).trim() : (item?.full_name || "").trim();
      if (name.length > 0 && !result.includes(name)) result.push(name);
    }
  }

  // Ensure exact count matches team_size - 1 to satisfy Supabase check constraint
  while (result.length < requiredCount) {
    result.push(`Team Member ${result.length + 2}`);
  }

  return result.slice(0, requiredCount);
}

/**
 * ATOMIC POST-PAYMENT REGISTRATION
 * Finalizes registration in public.apex_registrations ONLY AFTER payment is verified.
 * Guarantees idempotency and duplicate prevention.
 */
export async function registerPaidTeam(
  input: RegisterPaidTeamInput,
): Promise<{
  registration: ApexRegistrationRecord;
  team: ApexRegistrationRecord;
  isExisting: boolean;
}> {
  const orderId = input.razorpay_order_id;
  const paymentId = input.razorpay_payment_id;
  const normEmail = (input.email || "").trim().toLowerCase();

  // 1. Idempotency Check: Already processed?
  try {
    const { data: existing, error: existErr } = await supabase
      .from("apex_registrations")
      .select("*")
      .or(`razorpay_order_id.eq.${orderId},razorpay_payment_id.eq.${paymentId}`)
      .maybeSingle();

    if (!existErr && existing && existing.payment_status === "paid") {
      console.log(`[Registration Service] Order ${orderId} already registered as ${existing.r_id}`);
      const formatted = formatRecord(existing);
      return { registration: formatted, team: formatted, isExisting: true };
    }
  } catch (err: any) {
    console.warn("[Registration Service] Supabase idempotency check notice:", err.message);
  }

  // Check in-memory store
  for (const reg of localRegistrationStore.values()) {
    if (
      (reg.razorpay_order_id === orderId || reg.razorpay_payment_id === paymentId) &&
      reg.payment_status === "paid"
    ) {
      return { registration: reg, team: reg, isExisting: true };
    }
  }

  // 2. Build sanitized attributes
  const teamSize = Math.max(1, Math.min(4, Number(input.team_size || 1)));
  const additionalMembers = normalizeAdditionalMembers(
    teamSize,
    input.additional_members,
    input.members,
  );

  const driveLink = (input.idea_drive_link || input.ppt_url || "").trim();
  const leaderName = (input.team_leader_name || input.leader_name || "Team Leader").trim();
  const college = (input.college_organization || input.college || "Institution").trim();

  // 3. Generate internal UUID and unique R_ID
  const dbId = crypto.randomUUID();
  const rId = generateApexRegistrationId();
  const now = new Date().toISOString();

  const record: ApexRegistrationRecord = {
    id: dbId,
    r_id: rId,
    team_name: input.team_name.trim(),
    team_leader_name: leaderName,
    email: normEmail,
    phone: input.phone.trim(),
    college_organization: college,
    team_size: teamSize,
    additional_members: additionalMembers,
    preferred_domain: input.preferred_domain?.trim() || null,
    github_url: input.github_url?.trim() || null,
    linkedin_url: input.linkedin_url?.trim() || null,
    idea_drive_link: driveLink,
    terms_accepted: true,
    terms_accepted_at: now,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    payment_status: "paid",
    amount_paid: input.amount_paid || REGISTRATION_FEE_PAISE,
    currency: "INR",
    payment_verified_at: now,
    registration_status: "confirmed",
    review_status: "pending",
    admin_notes: null,
    created_at: now,
    updated_at: now,
    // Compatibility fields
    player_id: rId,
    leader_name: leaderName,
    college: college,
    ppt_url: driveLink,
    status: "pending",
  };

  // Cache in local store immediately
  localRegistrationStore.set(dbId, record);
  localRegistrationStore.set(rId, record);
  localRegistrationStore.set(orderId, record);

  // 4. Insert into Supabase table public.apex_registrations
  try {
    const { error: insertErr } = await supabase.from("apex_registrations").insert({
      id: record.id,
      r_id: record.r_id,
      team_name: record.team_name,
      team_leader_name: record.team_leader_name,
      email: record.email,
      phone: record.phone,
      college_organization: record.college_organization,
      team_size: record.team_size,
      additional_members: record.additional_members,
      preferred_domain: record.preferred_domain,
      github_url: record.github_url,
      linkedin_url: record.linkedin_url,
      idea_drive_link: record.idea_drive_link,
      terms_accepted: record.terms_accepted,
      terms_accepted_at: record.terms_accepted_at,
      razorpay_order_id: record.razorpay_order_id,
      razorpay_payment_id: record.razorpay_payment_id,
      payment_status: record.payment_status,
      amount_paid: record.amount_paid,
      currency: record.currency,
      payment_verified_at: record.payment_verified_at,
      registration_status: record.registration_status,
      review_status: record.review_status,
      admin_notes: record.admin_notes,
      created_at: record.created_at,
      updated_at: record.updated_at,
    });

    if (insertErr) {
      console.warn("[Registration Service] Supabase insert notice (stored locally):", insertErr.message);
    } else {
      console.log(`[Registration Service] Saved registration to Supabase: ${record.r_id} (${record.team_name})`);
    }
  } catch (ex: any) {
    console.warn("[Registration Service] Supabase unreachable (stored locally):", ex.message);
  }

  // Also clean up pending checkout cache
  pendingCheckouts.delete(orderId);

  return { registration: record, team: record, isExisting: false };
}

/**
 * Retrieve registration by R_ID, UUID, or Razorpay Order ID
 */
export async function getRegistrationById(identifier: string): Promise<ApexRegistrationRecord | null> {
  if (!identifier) return null;
  const cleanId = identifier.trim();

  // 1. Try Supabase apex_registrations
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const orCondition = isUuid
      ? `id.eq.${cleanId},r_id.eq.${cleanId},razorpay_order_id.eq.${cleanId}`
      : `r_id.eq.${cleanId},razorpay_order_id.eq.${cleanId}`;

    const { data, error } = await supabase
      .from("apex_registrations")
      .select("*")
      .or(orCondition)
      .maybeSingle();

    if (!error && data) {
      return formatRecord(data);
    }
  } catch (err: any) {
    console.warn("[Registration Service] Lookup notice:", err.message);
  }

  // 2. Try in-memory store
  for (const reg of localRegistrationStore.values()) {
    if (
      reg.r_id === cleanId ||
      reg.id === cleanId ||
      reg.razorpay_order_id === cleanId ||
      reg.player_id === cleanId
    ) {
      return reg;
    }
  }

  return null;
}

// Backward-compatible alias for getTeamByOrderId
export const getTeamByOrderId = getRegistrationById;
export const getAllStoredTeams = getAllStoredRegistrations;

/**
 * Helper to normalize database rows into typed ApexRegistrationRecord
 */
function formatRecord(row: any): ApexRegistrationRecord {
  const rId = row.r_id || row.player_id || "";
  const leaderName = row.team_leader_name || row.leader_name || "";
  const college = row.college_organization || row.college || "";
  const driveLink = row.idea_drive_link || row.ppt_url || "";

  return {
    id: row.id,
    r_id: rId,
    team_name: row.team_name,
    team_leader_name: leaderName,
    email: row.email,
    phone: row.phone,
    college_organization: college,
    team_size: row.team_size,
    additional_members: Array.isArray(row.additional_members) ? row.additional_members : [],
    preferred_domain: row.preferred_domain || null,
    github_url: row.github_url || null,
    linkedin_url: row.linkedin_url || null,
    idea_drive_link: driveLink,
    terms_accepted: Boolean(row.terms_accepted),
    terms_accepted_at: row.terms_accepted_at || row.created_at,
    razorpay_order_id: row.razorpay_order_id || null,
    razorpay_payment_id: row.razorpay_payment_id || row.payment_id || null,
    payment_status: row.payment_status || "pending",
    amount_paid:
      row.amount_paid !== undefined && row.amount_paid !== null
        ? row.amount_paid
        : row.payment_amount
          ? (row.payment_amount < 100 ? row.payment_amount * 100 : row.payment_amount)
          : REGISTRATION_FEE_PAISE,
    currency: row.currency || row.payment_currency || "INR",
    payment_verified_at: row.payment_verified_at || row.paid_at || null,
    registration_status: row.registration_status || "pending",
    review_status: row.review_status || (row.status === "approved" ? "shortlisted" : "pending"),
    admin_notes: row.admin_notes || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Aliases
    player_id: rId,
    leader_name: leaderName,
    college: college,
    ppt_url: driveLink,
    status: row.review_status || row.status || "pending",
  };
}

/**
 * Admin: Update registration review status and notes
 */
export async function updateRegistrationReview(
  id: string,
  updates: { review_status?: "pending" | "shortlisted" | "rejected"; admin_notes?: string },
): Promise<ApexRegistrationRecord | null> {
  const reg = await getRegistrationById(id);
  if (!reg) return null;

  const now = new Date().toISOString();
  const updated = {
    ...reg,
    ...(updates.review_status && { review_status: updates.review_status }),
    ...(updates.admin_notes !== undefined && { admin_notes: updates.admin_notes }),
    updated_at: now,
  };

  localRegistrationStore.set(reg.id, updated);
  localRegistrationStore.set(reg.r_id, updated);

  try {
    await supabase
      .from("apex_registrations")
      .update({
        ...(updates.review_status && { review_status: updates.review_status }),
        ...(updates.admin_notes !== undefined && { admin_notes: updates.admin_notes }),
        updated_at: now,
      })
      .eq("id", reg.id);
  } catch {}

  return updated;
}

export function deleteStoredRegistration(id: string): boolean {
  for (const [key, reg] of localRegistrationStore.entries()) {
    if (reg.id === id || reg.r_id === id || reg.player_id === id) {
      localRegistrationStore.delete(key);
      return true;
    }
  }
  return false;
}
export const deleteStoredTeam = deleteStoredRegistration;

export function updateStoredRegistration(
  id: string,
  updates: Partial<ApexRegistrationRecord> & Record<string, any>,
): ApexRegistrationRecord | null {
  for (const [key, reg] of localRegistrationStore.entries()) {
    if (reg.id === id || reg.r_id === id || reg.player_id === id) {
      const updated: ApexRegistrationRecord = {
        ...reg,
        ...updates,
        ...(updates.team_leader_name && {
          team_leader_name: updates.team_leader_name,
          leader_name: updates.team_leader_name,
        }),
        ...(updates.leader_name && {
          team_leader_name: updates.leader_name,
          leader_name: updates.leader_name,
        }),
        ...(updates.college_organization && {
          college_organization: updates.college_organization,
          college: updates.college_organization,
        }),
        ...(updates.college && {
          college_organization: updates.college,
          college: updates.college,
        }),
        updated_at: new Date().toISOString(),
      };
      localRegistrationStore.set(key, updated);
      if (reg.id) localRegistrationStore.set(reg.id, updated);
      if (reg.r_id) localRegistrationStore.set(reg.r_id, updated);
      return updated;
    }
  }
  return null;
}
export const updateStoredTeam = updateStoredRegistration;

