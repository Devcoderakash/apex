/**
 * Comprehensive Verification Suite for APEX//1.0 Production Resend Email Integration
 */

import { Resend } from "resend";
import { config } from "../src/config/env.js";
import {
  extractEmailData,
  getEmailDeliveryStatus,
  sendAdminRegistrationNotification,
  sendRegistrationConfirmationEmail,
} from "../src/services/email.service.js";
import {
  generateAdminRegistrationNotificationEmail,
  generateRegistrationConfirmationEmail,
} from "../src/services/email-template.js";
import { registerPaidTeam } from "../src/services/registration.service.js";
import { supabase } from "../src/services/supabase.service.js";

async function runEmailProductionSuite() {
  console.log("==================================================");
  console.log("🚀 APEX 1.0 — PRODUCTION EMAIL SYSTEM VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Verify Resend Domain
  console.log("\n[TEST 1] Verifying Resend Domain & Capabilities...");
  const resend = new Resend(config.email.resendApiKey);
  const domainsRes = await resend.domains.list();
  const domain = domainsRes.data?.data?.find((d) => d.name === "mail.apexhack.online");

  assert(Boolean(domain), "Domain mail.apexhack.online is registered in Resend");
  assert(domain?.status === "verified", `Domain status is '${domain?.status}' (verified)`);
  assert(domain?.capabilities?.sending === "enabled", "Domain sending capability is 'enabled'");

  // 2. Test Email Templates
  console.log("\n[TEST 2] Testing Email Templates (HTML + Plain Text)...");
  const sampleData = {
    playerId: "APEX-TESTPROD2026",
    teamName: "Neural Forge",
    leaderName: "Aarav Patel",
    email: "apexhackathon2k26@gmail.com",
    phone: "+91 9876543210",
    college: "SISTEC Bhopal",
    teamSize: 2,
    members: [{ full_name: "Rohan Verma", position: 2 }],
    preferredDomain: "AI & Autonomous Systems",
    ideaDriveLink: "https://drive.google.com/file/d/test1234/view",
    paymentStatus: "paid",
    paymentAmount: 10,
    paymentId: "pay_test_prod_1234",
    orderId: "order_test_prod_1234",
  };

  const participantEmail = generateRegistrationConfirmationEmail(sampleData);
  assert(participantEmail.subject.includes("APEX-TESTPROD2026"), "Participant subject contains R_ID");
  assert(participantEmail.html.includes("₹10"), "Participant HTML confirms ₹10 payment");
  assert(participantEmail.html.includes("https://drive.google.com/file/d/test1234/view"), "Participant HTML contains Drive Link");
  assert(participantEmail.text.includes("OFFICIAL REGISTRATION ID"), "Participant plain-text fallback valid");

  const adminEmail = generateAdminRegistrationNotificationEmail(sampleData);
  assert(adminEmail.subject.includes("[NEW REGISTRATION]"), "Admin subject has [NEW REGISTRATION] prefix");
  assert(adminEmail.subject.includes("₹10 Paid"), "Admin subject confirms ₹10 payment");
  assert(adminEmail.html.includes("OPEN GOOGLE DRIVE PRESENTATION"), "Admin HTML contains Drive CTA");
  assert(adminEmail.text.includes("APEX 1.0 Administration Team"), "Admin plain text fallback valid");

  // 3. Create a test verified registration to test live dispatch
  console.log("\n[TEST 3] Creating Test Verified Registration in System...");
  const testOrderId = `order_test_${Date.now()}`;
  const testPaymentId = `pay_test_${Date.now()}`;

  const { registration } = await registerPaidTeam({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    amount_paid: 1000,
    team_name: "Apex Elite Prod Test",
    team_leader_name: "Akash Lodhi",
    email: "apexhackathon2k26@gmail.com",
    phone: "7869461895",
    college_organization: "SISTEC Bhopal",
    team_size: 2,
    additional_members: ["Sameer Gupta"],
    idea_drive_link: "https://drive.google.com/file/d/1BKFqCRbHsvf5_D_0tpsT6hsMlMszhGg6/view",
    terms_accepted: true,
  });

  assert(Boolean(registration.r_id), `Registered team with R_ID: ${registration.r_id}`);

  // 4. Test Live Participant & Admin Email Sending
  console.log("\n[TEST 4] Dispatching Live Emails via Resend (mail.apexhack.online)...");
  const sendResult = await sendRegistrationConfirmationEmail(registration.r_id, true);

  assert(sendResult.success === true, `Participant email sent successfully (ID: ${sendResult.messageId})`);
  assert(sendResult.provider === "resend", "Provider used was 'resend'");
  assert(Boolean(sendResult.messageId), "Received Resend message ID");

  // Also verify admin notification was sent
  const adminResult = await sendAdminRegistrationNotification(registration.r_id, true);
  assert(adminResult.success === true, `Admin notification sent successfully (ID: ${adminResult.messageId})`);

  // 5. Test Delivery Event on Resend
  if (sendResult.messageId && !sendResult.messageId.startsWith("sim_")) {
    console.log("\n[TEST 5] Checking Delivery Status from Resend API...");
    // Give Resend a moment to process event
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const emailDetail = await resend.emails.get(sendResult.messageId);
      console.log(`  Resend Event: ${emailDetail.data?.last_event} | To: ${emailDetail.data?.to?.join(", ")}`);
      assert(
        emailDetail.data?.last_event === "delivered" || emailDetail.data?.last_event === "sent",
        `Email status on Resend is '${emailDetail.data?.last_event}'`,
      );
    } catch (err: any) {
      console.warn("  Notice checking event:", err.message);
    }
  }

  // 6. Test Idempotency
  console.log("\n[TEST 6] Testing Idempotency (Duplicate Prevention)...");
  const secondSend = await sendRegistrationConfirmationEmail(registration.r_id, false);
  assert(secondSend.alreadySent === true, "Second send was blocked by idempotency guard (alreadySent: true)");

  const secondAdminSend = await sendAdminRegistrationNotification(registration.r_id, false);
  assert(secondAdminSend.messageId === "cached_admin", "Second admin notice blocked by idempotency guard");

  // 7. Test Email Status Lookup
  console.log("\n[TEST 7] Testing Email Delivery Status Query...");
  const status = await getEmailDeliveryStatus(registration.r_id);
  assert(status?.status === "sent" || status?.status === "cached", `Status retrieved: ${JSON.stringify(status)}`);

  // 8. Clean up test row
  console.log("\n[CLEANUP] Cleaning up test registration...");
  if (registration.id) {
    await supabase.from("apex_registrations").delete().eq("id", registration.id);
  }

  console.log("\n==================================================");
  console.log(`🎉 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEmailProductionSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
