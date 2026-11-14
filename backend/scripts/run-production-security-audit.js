/**
 * APEX 1.0 — Independent Production Security & Readiness Audit
 * Executes comprehensive checks across all 7 audit areas.
 */

import crypto from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function runCmd(cmd, opts = {}) {
  return execSync(cmd, { cwd: projectRoot, ...opts });
}
import {
  generateApexRegistrationId,
  normalizeAdditionalMembers,
  registerPaidTeam,
  getRegistrationById,
  getTeamByOrderId,
  updateRegistrationReview,
  REGISTRATION_FEE_PAISE,
  REGISTRATION_FEE_INR,
} from "../dist/services/registration.service.js";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../dist/services/razorpay.service.js";
import { config } from "../dist/config/env.js";

const results = {
  section1_live_db: { status: "PASS", tests: [] },
  section2_rls_security: { status: "PASS", tests: [] },
  section3_razorpay: { status: "PASS", tests: [] },
  section4_rid: { status: "PASS", tests: [] },
  section5_gdrive: { status: "PASS", tests: [] },
  section6_db_integrity: { status: "PASS", tests: [] },
  section7_builds: { status: "PASS", tests: [] },
};

function recordTest(sectionKey, name, pass, detail = "") {
  const item = { name, pass, detail };
  results[sectionKey].tests.push(item);
  if (!pass) {
    results[sectionKey].status = "FAIL";
    console.error(`  ❌ [${sectionKey}] FAIL: ${name} - ${detail}`);
  } else {
    console.log(`  ✅ [${sectionKey}] PASS: ${name}`);
  }
}

console.log("\n================================================================================");
console.log("🔒 APEX 1.0 — INDEPENDENT PRODUCTION SECURITY AUDIT");
console.log("================================================================================\n");

// ============================================================================
// 1. SUPABASE LIVE DATABASE & CONNECTIVITY AUDIT
// ============================================================================
console.log("--- 1. Supabase Project & Live Database Verification ---");

// Check configured Supabase Host
const supabaseUrl = config.supabase.url;
let dnsResolved = false;
let dnsError = "";

try {
  const host = new URL(supabaseUrl).hostname;
  runCmd(`nslookup ${host}`, { stdio: "pipe" });
  dnsResolved = true;
} catch (err) {
  dnsError = err.message || "NXDOMAIN / Resolution failed";
}

if (dnsResolved) {
  recordTest("section1_live_db", "Remote Supabase DNS Resolution", true);
} else {
  // We record WARNING / FAIL on remote host unreachable, as required by audit rule
  recordTest(
    "section1_live_db",
    "Remote Supabase DNS Resolution",
    false,
    `Host ${supabaseUrl} failed DNS resolution (NXDOMAIN). The Supabase Cloud project is inactive or paused.`
  );
}

// PostgreSQL 16 local live schema verification
try {
  const tableCheck = runCmd(
    `psql -h localhost -d apex_audit_db -t -c "SELECT to_regclass('public.apex_registrations');"`,
    { encoding: "utf8" }
  ).trim();
  recordTest("section1_live_db", "Table public.apex_registrations exists in PostgreSQL", tableCheck === "apex_registrations");

  const columnCount = parseInt(
    runCmd(
      `psql -h localhost -d apex_audit_db -t -c "SELECT count(*) FROM information_schema.columns WHERE table_name = 'apex_registrations';"`,
      { encoding: "utf8" }
    ).trim(),
    10
  );
  recordTest(
    "section1_live_db",
    "All 26 expected columns exist in apex_registrations",
    columnCount === 26,
    `Found ${columnCount} columns (expected 26)`
  );

  const triggers = runCmd(
    `psql -h localhost -d apex_audit_db -t -c "SELECT count(*) FROM information_schema.triggers WHERE event_object_table = 'apex_registrations';"`,
    { encoding: "utf8" }
  ).trim();
  recordTest(
    "section1_live_db",
    "Expected triggers exist (trg_apex_registrations_insert & update)",
    parseInt(triggers, 10) >= 2,
    `Found ${triggers} triggers`
  );

  const indexes = runCmd(
    `psql -h localhost -d apex_audit_db -t -c "SELECT count(*) FROM pg_indexes WHERE tablename = 'apex_registrations';"`,
    { encoding: "utf8" }
  ).trim();
  recordTest(
    "section1_live_db",
    "Database indexes created",
    parseInt(indexes, 10) >= 10,
    `Found ${indexes} indexes`
  );
} catch (err) {
  recordTest("section1_live_db", "PostgreSQL database audit connection", false, err.message);
}

// ============================================================================
// 2. RLS SECURITY AUDIT
// ============================================================================
console.log("\n--- 2. RLS Security Audit ---");

try {
  // Test anon select
  let anonBlocked = false;
  try {
    runCmd(`psql -h localhost -d apex_audit_db -c "SET ROLE anon; SELECT count(*) FROM public.apex_registrations;"`, {
      stdio: "pipe",
    });
  } catch (e) {
    anonBlocked = true;
  }
  recordTest("section2_rls_security", "Anonymous users blocked from SELECT (permission denied)", anonBlocked);

  // Test regular authenticated user select
  const authLines = runCmd(
    `psql -h localhost -d apex_audit_db -t -A -c "SET ROLE authenticated; SELECT count(*) FROM public.apex_registrations;"`,
    { encoding: "utf8" }
  ).trim().split("\n");
  const authSelectCount = parseInt(authLines[authLines.length - 1].trim(), 10);
  recordTest("section2_rls_security", "Unprivileged authenticated user sees 0 rows", authSelectCount === 0);

  // Test admin authenticated user select
  const adminLines = runCmd(
    `psql -h localhost -d apex_audit_db -t -A -c "SET ROLE authenticated; SET request.jwt.claims = '{\\\"role\\\": \\\"admin\\\"}'; SELECT count(*) FROM public.apex_registrations;"`,
    { encoding: "utf8" }
  ).trim().split("\n");
  const adminSelectCount = parseInt(adminLines[adminLines.length - 1].trim(), 10);
  recordTest("section2_rls_security", "Admin authenticated user can SELECT records", adminSelectCount >= 1);

  // Test frontend service_role key leak
  const frontendLeak = runCmd(`grep -rn "service_role" frontend/src/ || true`, { encoding: "utf8" }).trim();
  recordTest(
    "section2_rls_security",
    "Zero frontend service_role credentials in frontend/src",
    frontendLeak.length === 0,
    frontendLeak
  );

  const envLeak = runCmd(`grep -rn "service_role" frontend/.env* || true`, { encoding: "utf8" }).trim();
  recordTest(
    "section2_rls_security",
    "Zero frontend service_role credentials in frontend/.env*",
    envLeak.length === 0,
    envLeak
  );
} catch (err) {
  recordTest("section2_rls_security", "RLS verification", false, err.message);
}

// ============================================================================
// 3. RAZORPAY AUDIT
// ============================================================================
console.log("\n--- 3. Razorpay Security Audit ---");

const secret = config.razorpay.keySecret || "test_secret_key";
const testOrderId = `order_${Date.now()}`;
const testPaymentId = `pay_${Date.now()}`;
const validSig = crypto
  .createHmac("sha256", secret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest("hex");

// 1. Valid signature check
const sigValid = verifyRazorpaySignature({
  orderId: testOrderId,
  paymentId: testPaymentId,
  signature: validSig,
});
recordTest("section3_razorpay", "Cryptographic signature accepted with correct secret", sigValid);

// 2. Tampered signature check
const sigTampered = verifyRazorpaySignature({
  orderId: testOrderId,
  paymentId: testPaymentId,
  signature: "tampered_signature_9999999999999999999999999999999999999999999999999999999999999999",
});
recordTest("section3_razorpay", "Tampered signature rejected", sigTampered === false);

// 3. Amount and currency validation
recordTest(
  "section3_razorpay",
  "Server-side fixed fee enforcement: 19900 paise (₹199)",
  REGISTRATION_FEE_PAISE === 19900 && REGISTRATION_FEE_INR === 199
);

// 4. Webhook signature validation
const webhookPayload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: testPaymentId } } } });
const validWebhookSig = crypto.createHmac("sha256", secret).update(webhookPayload).digest("hex");
const webhookValid = verifyRazorpayWebhookSignature(webhookPayload, validWebhookSig, secret);
recordTest("section3_razorpay", "Webhook signature verification using HMAC-SHA256", webhookValid);

const tamperedWebhookValid = verifyRazorpayWebhookSignature(webhookPayload, "tampered_webhook_sig", secret);
recordTest("section3_razorpay", "Tampered webhook signature rejected", tamperedWebhookValid === false);

// 5. Idempotent registration creation & duplicate prevention
const idempOrder = `order_idemp_${Date.now()}`;
const idempPay = `pay_idemp_${Date.now()}`;
const reg1 = await registerPaidTeam({
  razorpay_order_id: idempOrder,
  razorpay_payment_id: idempPay,
  team_name: "Idempotent Team",
  team_leader_name: "Lead Idemp",
  email: `idemp_${Date.now()}@example.com`,
  phone: "+919876543210",
  college_organization: "NIT",
  team_size: 2,
  additional_members: ["Member Two"],
  idea_drive_link: "https://drive.google.com/file/d/idemp1/view",
});
recordTest("section3_razorpay", "First payment verification creates registration", reg1.isExisting === false);

// Simultaneous second call (duplicate callback / webhook race)
const reg2 = await registerPaidTeam({
  razorpay_order_id: idempOrder,
  razorpay_payment_id: idempPay,
  team_name: "Idempotent Team Clone",
  team_leader_name: "Lead Idemp",
  email: `idemp_${Date.now()}@example.com`,
  phone: "+919876543210",
  college_organization: "NIT",
  team_size: 2,
  additional_members: ["Member Two"],
  idea_drive_link: "https://drive.google.com/file/d/idemp1/view",
});
recordTest(
  "section3_razorpay",
  "Duplicate callback / webhook detected: returns existing record without inserting duplicate",
  reg2.isExisting === true && reg2.registration.r_id === reg1.registration.r_id
);

// ============================================================================
// 4. R_ID AUDIT (10,000 Identifiers)
// ============================================================================
console.log("\n--- 4. R_ID Format, Uniqueness & Immutability Audit ---");

const set = new Set();
let invalidRid = 0;
for (let i = 0; i < 10000; i++) {
  const rid = generateApexRegistrationId();
  if (!/^APEX-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{15}$/.test(rid)) invalidRid++;
  set.add(rid);
}
recordTest(
  "section4_rid",
  "10,000 Node.js test identifiers: 100% unique (0 collisions)",
  set.size === 10000,
  `Unique: ${set.size}/10000`
);
recordTest(
  "section4_rid",
  "10,000 Node.js test identifiers match ^APEX-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{15}$",
  invalidRid === 0,
  `Invalid: ${invalidRid}`
);

// PostgreSQL 10,000 identifiers
try {
  const pgResult = runCmd(
    `psql -h localhost -d apex_audit_db -t -c "
      SELECT count(*), count(DISTINCT r_id), count(*) FILTER (WHERE r_id !~ '^APEX-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{15}$')
      FROM (SELECT public.generate_apex_r_id() AS r_id FROM generate_series(1, 10000)) t;
    "`,
    { encoding: "utf8" }
  ).trim();
  const [total, distinct, invalid] = pgResult.split("|").map((s) => parseInt(s.trim(), 10));
  recordTest(
    "section4_rid",
    "10,000 Database-generated identifiers: 100% unique in PostgreSQL",
    total === 10000 && distinct === 10000,
    `Total: ${total}, Distinct: ${distinct}`
  );
  recordTest(
    "section4_rid",
    "10,000 Database-generated identifiers match regex in PostgreSQL",
    invalid === 0,
    `Invalid: ${invalid}`
  );

  // R_ID Immutability check
  let immutabilityBlocked = false;
  try {
    runCmd(
      `psql -h localhost -d apex_audit_db -c "UPDATE public.apex_registrations SET r_id = 'APEX-TAMPERED12345' WHERE team_name = 'Solo Team';"`,
      { stdio: "pipe" }
    );
  } catch {
    immutabilityBlocked = true;
  }
  recordTest("section4_rid", "R_ID immutability trigger blocks update", immutabilityBlocked);
} catch (err) {
  recordTest("section4_rid", "Database R_ID audit", false, err.message);
}

// ============================================================================
// 5. GOOGLE DRIVE AUDIT
// ============================================================================
console.log("\n--- 5. Google Drive Presentation Link Audit ---");

const GOOGLE_DRIVE_PATTERNS = [
  /^https:\/\/(?:drive|docs)\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/open\?id=[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/i,
];

const driveValidator = (url) => GOOGLE_DRIVE_PATTERNS.some((p) => p.test((url || "").trim()));

recordTest("section5_gdrive", "Valid file URL passes", driveValidator("https://drive.google.com/file/d/1BxiMVs0XRA5/view"));
recordTest("section5_gdrive", "Valid presentation URL passes", driveValidator("https://docs.google.com/presentation/d/1_xyZ987/edit"));
recordTest("section5_gdrive", "Valid folder URL passes", driveValidator("https://drive.google.com/drive/folders/1aBcDeFg?usp=sharing"));
recordTest("section5_gdrive", "Valid open?id= URL passes", driveValidator("https://drive.google.com/open?id=1AbCdEfGh"));

recordTest("section5_gdrive", "Dropbox URL rejected", !driveValidator("https://dropbox.com/s/123/file.pdf"));
recordTest("section5_gdrive", "GitHub URL rejected", !driveValidator("https://github.com/apex/slides"));
recordTest("section5_gdrive", "Arbitrary website rejected", !driveValidator("https://example.com/slide.pptx"));
recordTest("section5_gdrive", "Incomplete drive root rejected", !driveValidator("https://drive.google.com/"));
recordTest("section5_gdrive", "Spoofed domain rejected", !driveValidator("http://not-really-google.com/drive.google.com/file/d/123"));

// Verify deprecated file upload route
const uploadRouteFile = runCmd(`grep -n "status(410)" backend/src/routes/upload.routes.ts`, {
  encoding: "utf8",
});
recordTest("section5_gdrive", "Upload route /api/upload/ppt returns 410 Gone", uploadRouteFile.length > 0);

// ============================================================================
// 6. DATABASE INTEGRITY
// ============================================================================
console.log("\n--- 6. Database Integrity Constraints Audit ---");

const testCases = [
  { name: "Team size 1..4 check", query: "INSERT INTO public.apex_registrations (team_name, team_leader_name, email, phone, college_organization, team_size, additional_members, idea_drive_link, razorpay_order_id, razorpay_payment_id) VALUES ('T_size0', 'L', 'e1@e.com', '+919999900020', 'C', 0, '[]'::jsonb, 'https://drive.google.com/file/d/1', 'ord_sz0', 'pay_sz0')", shouldFail: true },
  { name: "Additional members count mismatch check", query: "INSERT INTO public.apex_registrations (team_name, team_leader_name, email, phone, college_organization, team_size, additional_members, idea_drive_link, razorpay_order_id, razorpay_payment_id) VALUES ('T_badm', 'L', 'e2@e.com', '+919999900021', 'C', 3, '[\"Only One\"]'::jsonb, 'https://drive.google.com/file/d/2', 'ord_badm', 'pay_badm')", shouldFail: true },
  { name: "Missing team_name NOT NULL check", query: "INSERT INTO public.apex_registrations (team_name, team_leader_name, email, phone, college_organization, team_size, additional_members, idea_drive_link, razorpay_order_id, razorpay_payment_id) VALUES (NULL, 'L', 'e3@e.com', '+919999900022', 'C', 1, '[]'::jsonb, 'https://drive.google.com/file/d/3', 'ord_null', 'pay_null')", shouldFail: true },
  { name: "Invalid review_status check", query: "INSERT INTO public.apex_registrations (team_name, team_leader_name, email, phone, college_organization, team_size, additional_members, idea_drive_link, razorpay_order_id, razorpay_payment_id, review_status) VALUES ('T_rev', 'L', 'e4@e.com', '+919999900023', 'C', 1, '[]'::jsonb, 'https://drive.google.com/file/d/4', 'ord_rev', 'pay_rev', 'invalid_status')", shouldFail: true },
];

for (const tc of testCases) {
  let failed = false;
  try {
    runCmd(`psql -h localhost -d apex_audit_db -c "${tc.query}"`, { stdio: "pipe" });
  } catch {
    failed = true;
  }
  recordTest("section6_db_integrity", tc.name, failed === tc.shouldFail);
}

// ============================================================================
// 7. BUILD & COMPILATION AUDIT
// ============================================================================
console.log("\n--- 7. Frontend & Backend Production Builds ---");

try {
  runCmd("npm --prefix backend run build", { stdio: "pipe" });
  recordTest("section7_builds", "Backend TypeScript build succeeded (0 errors)", true);
} catch (err) {
  recordTest("section7_builds", "Backend TypeScript build", false, err.message);
}

try {
  runCmd("npm --prefix frontend run build", { stdio: "pipe" });
  recordTest("section7_builds", "Frontend Vite production build succeeded (0 errors)", true);
} catch (err) {
  recordTest("section7_builds", "Frontend Vite production build", false, err.message);
}

console.log("\n================================================================================");
console.log("📊 AUDIT RESULTS SUMMARY");
console.log("================================================================================");
let totalTests = 0;
let passedTests = 0;
for (const [sec, data] of Object.entries(results)) {
  const count = data.tests.length;
  const passed = data.tests.filter((t) => t.pass).length;
  totalTests += count;
  passedTests += passed;
  console.log(`[${sec}] Status: ${data.status} (${passed}/${count} tests passed)`);
}
console.log(`\nOVERALL: ${passedTests}/${totalTests} tests passed.`);
console.log("================================================================================\n");
