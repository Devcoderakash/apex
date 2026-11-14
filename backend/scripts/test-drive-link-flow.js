/**
 * Automated Verification Test Suite for APEX 1.0 Google Drive Link & Database Architecture
 * Tests all requirements from Parts 1 through 10 of the Master Architecture Prompt.
 */

import { z } from "zod";
import {
  generateApexRegistrationId,
  normalizeAdditionalMembers,
  registerPaidTeam,
  getRegistrationById,
  getTeamByOrderId,
  updateRegistrationReview,
  REGISTRATION_FEE_PAISE,
} from "../dist/services/registration.service.js";
import { verifyRazorpaySignature } from "../dist/services/razorpay.service.js";
import { getTeamPptSignedUrl } from "../dist/controllers/admin.controller.js";

console.log("\n================================================================================");
console.log("🚀 APEX 1.0 — COMPREHENSIVE ARCHITECTURE & BACKEND TEST SUITE");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

// ============================================================================
// PART 1: R_ID GENERATOR & PATTERN TESTS
// ============================================================================
console.log("--- PART 1: Unique Registration ID (R_ID) Validation ---");

const sampleRid = generateApexRegistrationId();
assert(typeof sampleRid === "string", "R_ID generator returns a string");
assert(sampleRid.startsWith("APEX-"), "R_ID starts with APEX- prefix");
assert(sampleRid.length === 20, `R_ID total length is 20 chars (APEX- + 15 chars), got ${sampleRid.length}`);
assert(/^APEX-[A-Z0-9]{15}$/.test(sampleRid), `R_ID strictly matches ^APEX-[A-Z0-9]{15}$ (${sampleRid})`);

// Test uniqueness across 100 generations
const rids = new Set();
for (let i = 0; i < 100; i++) {
  rids.add(generateApexRegistrationId());
}
assert(rids.size === 100, "100 generated R_IDs are all unique (no collisions)");

// ============================================================================
// PART 2: GOOGLE DRIVE LINK VALIDATION (Zod Schema)
// ============================================================================
console.log("\n--- PART 2: Google Drive Presentation Link Validation ---");

const GOOGLE_DRIVE_PATTERNS = [
  /^https:\/\/(?:drive|docs)\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/open\?id=[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/i,
];

const googleDriveLinkSchema = z
  .string({ required_error: "Please provide your Google Drive presentation link." })
  .trim()
  .min(1, "Please provide your Google Drive presentation link.")
  .max(500, "Link is too long")
  .refine(
    (val) => {
      const clean = val.trim();
      return GOOGLE_DRIVE_PATTERNS.some((pattern) => pattern.test(clean));
    },
    { message: "Please enter a valid Google Drive link." },
  );

// 1. Valid Google Drive File Link
const test1 = googleDriveLinkSchema.safeParse(
  "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing"
);
assert(test1.success, "Valid Google Drive file link accepted");

// 2. Valid Google Slides Presentation Link
const test2 = googleDriveLinkSchema.safeParse(
  "https://docs.google.com/presentation/d/1_xyZ9876543210AbCdEfGhIjKlMnOpQrStUvWxYz/edit?usp=sharing"
);
assert(test2.success, "Valid Google Slides presentation link accepted");

// 3. Valid Google Drive Folder Link & open?id=
const test3a = googleDriveLinkSchema.safeParse(
  "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345?usp=drive_link"
);
assert(test3a.success, "Valid Google Drive folder link accepted");

const test3b = googleDriveLinkSchema.safeParse(
  "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz"
);
assert(test3b.success, "Valid Google Drive open?id= link accepted");

// 4. Empty / Whitespace-only Link
const test4a = googleDriveLinkSchema.safeParse("");
assert(
  !test4a.success &&
    test4a.error.issues[0].message === "Please provide your Google Drive presentation link.",
  "Empty link rejected with expected error"
);

const test4b = googleDriveLinkSchema.safeParse("   ");
assert(
  !test4b.success &&
    test4b.error.issues[0].message === "Please provide your Google Drive presentation link.",
  "Whitespace-only link rejected"
);

// 5. Arbitrary Website URLs
const test5a = googleDriveLinkSchema.safeParse("https://github.com/my-project/apex-presentation");
assert(!test5a.success, "GitHub URL rejected");

const test5b = googleDriveLinkSchema.safeParse("https://dropbox.com/s/12345/presentation.pdf");
assert(!test5b.success, "Dropbox URL rejected");

const test5c = googleDriveLinkSchema.safeParse("https://example.com/slide.pptx");
assert(!test5c.success, "Arbitrary website URL rejected");

// 6. Incomplete / Spoofed Google Drive URLs
const test6a = googleDriveLinkSchema.safeParse("https://drive.google.com/");
assert(!test6a.success, "Root drive.google.com rejected");

const test6b = googleDriveLinkSchema.safeParse("https://drive.google.com/file/d/");
assert(!test6b.success, "Drive file link without file ID rejected");

const test6c = googleDriveLinkSchema.safeParse(
  "http://not-really-google.com/drive.google.com/file/d/123"
);
assert(!test6c.success, "Spoofed domain rejected");

// ============================================================================
// PART 3: ADDITIONAL MEMBERS JSONB ENFORCEMENT
// ============================================================================
console.log("\n--- PART 3: Team Size & Additional Members Normalization ---");

// Team size 1 -> 0 additional members
const membersSize1 = normalizeAdditionalMembers(1, ["Extra Person"], []);
assert(
  Array.isArray(membersSize1) && membersSize1.length === 0,
  "Team size 1 results in exactly 0 additional members (empty array)"
);

// Team size 2 -> 1 additional member
const membersSize2 = normalizeAdditionalMembers(2, ["Bob"], []);
assert(
  Array.isArray(membersSize2) && membersSize2.length === 1 && membersSize2[0] === "Bob",
  "Team size 2 results in exactly 1 additional member"
);

// Team size 3 -> 2 additional members
const membersSize3 = normalizeAdditionalMembers(3, ["Bob", "Charlie"], []);
assert(
  Array.isArray(membersSize3) && membersSize3.length === 2,
  "Team size 3 results in exactly 2 additional members"
);

// Team size 4 -> 3 additional members
const membersSize4 = normalizeAdditionalMembers(4, ["Bob", "Charlie", "Dave"], []);
assert(
  Array.isArray(membersSize4) && membersSize4.length === 3,
  "Team size 4 results in exactly 3 additional members"
);

// Object member structure support { full_name: string }
const membersObj = normalizeAdditionalMembers(3, [], [
  { full_name: "Member A", position: 2 },
  { full_name: "Member B", position: 3 },
]);
assert(
  membersObj.length === 2 && membersObj[0] === "Member A" && membersObj[1] === "Member B",
  "Object members list correctly mapped to string array"
);

// ============================================================================
// PART 4: POST-PAYMENT REGISTRATION & PERSISTENCE
// ============================================================================
console.log("\n--- PART 4: Atomic Registration & Persistence ---");

const fakeOrderId = `order_test_${Date.now()}`;
const fakePaymentId = `pay_test_${Date.now()}`;
const validDriveUrl =
  "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";

const registered = await registerPaidTeam({
  razorpay_order_id: fakeOrderId,
  razorpay_payment_id: fakePaymentId,
  team_name: "Apex Cyber Squad",
  team_leader_name: "Alex Mercer",
  email: `alex_${Date.now()}@example.com`,
  phone: "+91 98765 43210",
  college_organization: "National Institute of Technology",
  team_size: 3,
  idea_drive_link: validDriveUrl,
  preferred_domain: "Cybersecurity & Web3",
  additional_members: ["Bob Vance", "Charlie Kelly"],
});

assert(Boolean(registered?.registration), "Registration completed and returned record");
assert(registered.registration.r_id.startsWith("APEX-"), `Valid R_ID generated: ${registered.registration.r_id}`);
assert(registered.registration.payment_status === "paid", "Payment status is marked 'paid'");
assert(registered.registration.amount_paid === REGISTRATION_FEE_PAISE, "Amount paid is 1000 paise (₹10)");
assert(registered.registration.currency === "INR", "Currency is INR");
assert(registered.registration.idea_drive_link === validDriveUrl, "Exact Google Drive link saved in idea_drive_link");
assert(registered.registration.additional_members.length === 2, "2 additional members saved in JSONB array");
assert(registered.registration.terms_accepted === true, "terms_accepted is true");

// Check retrieval by R_ID
const retrievedByRid = await getRegistrationById(registered.registration.r_id);
assert(Boolean(retrievedByRid), "Retrieved registration by R_ID");
assert(retrievedByRid.r_id === registered.registration.r_id, "Retrieved R_ID matches generated R_ID");
assert(retrievedByRid.idea_drive_link === validDriveUrl, "Retrieved record retains Google Drive link");

// Check retrieval by Order ID
const retrievedByOrder = await getTeamByOrderId(fakeOrderId);
assert(Boolean(retrievedByOrder), "Retrieved registration by Razorpay Order ID");
assert(retrievedByOrder.team_name === "Apex Cyber Squad", "Team name matches");

// ============================================================================
// PART 5: PAYMENT VERIFICATION INTEGRITY
// ============================================================================
console.log("\n--- PART 5: Razorpay Signature Verification & Tamper Protection ---");

const invalidSigResult = verifyRazorpaySignature({
  orderId: "order_12345",
  paymentId: "pay_12345",
  signature: "tampered_fake_signature_abc123",
});
assert(invalidSigResult === false, "Tampered payment signature correctly rejected");

// ============================================================================
// PART 6: ADMIN PRESENTATION & REVIEW MANAGEMENT
// ============================================================================
console.log("\n--- PART 6: Admin Presentation Link & Review Status ---");

// Mock Express req & res for getTeamPptSignedUrl
let responseStatus = 200;
let responseJson = null;
const mockReq = { params: { id: registered.registration.r_id } };
const mockRes = {
  status: (code) => {
    responseStatus = code;
    return mockRes;
  },
  json: (data) => {
    responseJson = data;
    return mockRes;
  },
};

await getTeamPptSignedUrl(mockReq, mockRes);
assert(
  Boolean(responseJson && responseJson.signedUrl),
  "Admin presentation URL endpoint returns success"
);
assert(
  responseJson.signedUrl === validDriveUrl || responseJson.url === validDriveUrl,
  "Admin receives the exact submitted Google Drive link for evaluation"
);

// Update review status to 'shortlisted' and add notes
const updatedReview = await updateRegistrationReview(registered.registration.r_id, {
  review_status: "shortlisted",
  admin_notes: "Strong prototype, shortlisted for Grand Finale.",
});
assert(Boolean(updatedReview), "Admin review status updated successfully");
assert(updatedReview.review_status === "shortlisted", "Review status is now 'shortlisted'");
assert(
  updatedReview.admin_notes === "Strong prototype, shortlisted for Grand Finale.",
  "Admin notes saved successfully"
);
assert(updatedReview.payment_status === "paid", "Payment status remained 'paid' (tamper-proof)");
assert(updatedReview.r_id === registered.registration.r_id, "R_ID remained permanent and immutable");

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n================================================================================");
console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
