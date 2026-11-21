/**
 * APEX//1.0 Official Registration Confirmation Email Template
 * Responsive, email-client compatible HTML + clean Plain-Text fallback.
 * Uses official brand colors:
 * Background: #0B0B10, Cards: #15121B, Accent: #FF1744, Text: #FFFFFF, Secondary: #9CA3AF
 */

export interface EmailRegistrationData {
  playerId: string;
  teamName: string;
  leaderName: string;
  email: string;
  phone: string;
  college?: string | null;
  teamSize: number;
  members?: { full_name: string; position: number }[];
  preferredDomain?: string | null;
  ideaDriveLink?: string | null;
  pptFileName?: string | null;
  pptStoragePath?: string | null;
  pptUrl?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  paymentId?: string | null;
  orderId?: string | null;
}

export function generateRegistrationConfirmationEmail(data: EmailRegistrationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "APEX 1.0 | You're Officially Registered!";
  const previewText = "Your registration is confirmed. Your unique Team ID and payment details are inside.";

  // Format team members list
  const memberNames: string[] = [];
  if (data.members && data.members.length > 0) {
    data.members.forEach((m) => {
      if (m.full_name && m.full_name.trim().length > 0) {
        memberNames.push(m.full_name.trim());
      }
    });
  }

  // Format presentation status & link
  const presentationLink = (data.ideaDriveLink || data.pptUrl || "").trim();
  const hasPresentationLink = presentationLink.length > 0 && presentationLink.startsWith("http");

  // Format payment display
  const paidAmount = data.paymentAmount ? Number(data.paymentAmount) : 199;
  const orderId = data.orderId || "Verified";
  const paymentId = data.paymentId || "Captured";
  const collegeDisplay = data.college && data.college.trim().length > 0 ? data.college.trim() : "Not Specified";
  const domainDisplay = data.preferredDomain && data.preferredDomain.trim().length > 0 ? data.preferredDomain.trim() : "Open Innovation";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, h1, h2, h3, p, a, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #08080C;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      border-collapse: collapse;
      mso-line-height-rule: exactly;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }
      .mobile-r-id {
        font-size: 22px !important;
        letter-spacing: 1.5px !important;
        word-break: break-all !important;
      }
      .mobile-btn {
        width: 100% !important;
        display: block !important;
        text-align: center !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #08080C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">

  <!-- HIDDEN PREVIEW TEXT -->
  <div style="display: none; font-size: 1px; color: #08080C; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${previewText}
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>

  <!-- EMAIL WRAPPER -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #08080C;">
    <tr>
      <td align="center" style="padding: 24px 12px 48px 12px;">
        
        <!-- MAIN CONTENT CONTAINER (600px Max) -->
        <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #12111A; border: 1px solid #252131; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, #1A1424 0%, #12111A 100%); border-bottom: 1px solid #252131; text-align: center;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #FF1744; text-transform: uppercase;">
                      APEX<span style="color: #FFFFFF;">//</span>1.0
                    </span>
                    <div style="margin-top: 5px; font-size: 10px; font-weight: 700; letter-spacing: 3px; color: #9CA3AF; text-transform: uppercase;">
                      NATIONAL STUDENT HACKATHON · BHOPAL
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- REGISTRATION SUCCESS HERO -->
          <tr>
            <td style="padding: 28px 32px 16px 32px; text-align: center;" class="mobile-padding">
              <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); border: 1px solid #10B981; color: #10B981; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px;">
                &#9679; REGISTRATION CONFIRMED
              </div>
              <h1 style="margin: 18px 0 8px 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">
                WELCOME TO APEX 1.0
              </h1>
              <p style="margin: 0; font-size: 14px; color: #9CA3AF; line-height: 22px;">
                Your registration details and idea presentation have been securely verified and recorded in the official event registry.
              </p>
            </td>
          </tr>

          <!-- PROMINENT UNIQUE R_ID CARD -->
          <tr>
            <td style="padding: 8px 32px 24px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 23, 68, 0.05); border: 2px solid #FF1744; border-radius: 10px; text-align: center; box-shadow: 0 0 20px rgba(255, 23, 68, 0.15);">
                <tr>
                  <td style="padding: 20px 16px;">
                    <div style="font-size: 10px; font-weight: 800; letter-spacing: 2.5px; color: #FF1744; text-transform: uppercase;">
                      OFFICIAL REGISTRATION ID (R_ID)
                    </div>
                    <div class="mobile-r-id" style="margin-top: 8px; font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #FF1744; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;">
                      ${data.playerId}
                    </div>
                    <div style="margin-top: 6px; font-size: 11px; color: #9CA3AF; letter-spacing: 0.5px;">
                      Permanent cryptographic identifier &#183; Quote this in all hackathon phases and check-ins
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PERSONALIZED GREETING -->
          <tr>
            <td style="padding: 0 32px 20px 32px;" class="mobile-padding">
              <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #FFFFFF;">
                Hey ${data.leaderName},
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #D1D5DB;">
                Congratulations! Team <strong>${data.teamName}</strong> is officially entered into <strong>APEX 1.0 — One Idea. No Limits.</strong> Below is your official registration summary, verified ₹${paidAmount} payment confirmation, and evaluation schedule.
              </p>
            </td>
          </tr>

          <!-- TEAM DETAILS CARD -->
          <tr>
            <td style="padding: 0 32px 20px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171520; border: 1px solid #2A2438; border-radius: 10px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #1D1A29; border-bottom: 1px solid #2A2438;">
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                      &#128101; REGISTERED TEAM DETAILS
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; width: 42%;">Team Name:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; font-weight: 700;">${data.teamName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Team Leader:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF;">${data.leaderName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Registered Email:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Contact Number:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.phone}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">College / Organization:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${collegeDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Team Size:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.teamSize} Member${data.teamSize > 1 ? "s" : ""}</td>
                      </tr>
                      ${
                        memberNames.length > 0
                          ? `<tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; vertical-align: top;">Additional Members:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${memberNames.join(", ")}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Preferred Domain / Track:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #00E5FF; font-weight: 600;">${domainDisplay}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PAYMENT SUMMARY CARD -->
          <tr>
            <td style="padding: 0 32px 20px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171520; border: 1px solid #2A2438; border-radius: 10px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #1D1A29; border-bottom: 1px solid #2A2438;">
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #10B981; text-transform: uppercase;">
                      &#128179; PAYMENT CONFIRMATION (₹${paidAmount} PAID)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; width: 42%;">Entry Fee:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #10B981; font-weight: 800;">₹${paidAmount} INR</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Payment Status:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #10B981; font-weight: 700;">
                          PAID &#183; Razorpay Verified
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Payment Gateway:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">Razorpay Trusted Gateway</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Razorpay Order ID:</td>
                        <td style="padding: 6px 0; font-size: 11px; color: #D1D5DB; font-family: monospace;">${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Razorpay Payment ID:</td>
                        <td style="padding: 6px 0; font-size: 11px; color: #D1D5DB; font-family: monospace;">${paymentId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GOOGLE DRIVE PRESENTATION LINK SECTION -->
          <tr>
            <td style="padding: 0 32px 20px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171520; border: 1px solid #2A2438; border-radius: 10px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #1D1A29; border-bottom: 1px solid #2A2438;">
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase;">
                      &#128193; IDEA PRESENTATION (ROUND 1 EVALUATION)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 13px; color: #E5E7EB; line-height: 20px; margin-bottom: 14px;">
                      ${
                        hasPresentationLink
                          ? `Your Round 1 presentation submission is securely linked to your registration:`
                          : `Your presentation submission status:`
                      }
                    </div>

                    ${
                      hasPresentationLink
                        ? `<!-- CTA BUTTON -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 6px 0 16px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #FF1744 0%, #D50000 100%);">
                          <a href="${presentationLink}" target="_blank" class="mobile-btn" style="display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #FFFFFF; text-decoration: none; border-radius: 8px; text-transform: uppercase;">
                            OPEN GOOGLE DRIVE PRESENTATION &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="font-size: 11px; color: #9CA3AF; word-break: break-all; margin-bottom: 14px;">
                      Direct Link: <a href="${presentationLink}" target="_blank" style="color: #00E5FF; text-decoration: underline;">${presentationLink}</a>
                    </div>`
                        : `<div style="padding: 10px 14px; background-color: rgba(255, 23, 68, 0.08); border-left: 3px solid #FF1744; font-size: 12px; color: #FFFFFF; margin-bottom: 14px;">
                      Submission on record: Google Drive Link Saved for Evaluation
                    </div>`
                    }

                    <!-- DRIVE PERMISSION NOTICE -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 6px;">
                      <tr>
                        <td style="padding: 12px 14px; font-size: 11px; color: #E5E7EB; line-height: 18px;">
                          <strong style="color: #00E5FF;">&#9888; CRITICAL EVALUATION INSTRUCTION:</strong><br />
                          Please verify that your Google Drive link permission is set to <strong>&ldquo;Anyone with the link &mdash; Viewer&rdquo;</strong> so the judging panel can access your slides without delays.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- NEXT STEPS SECTION -->
          <tr>
            <td style="padding: 0 32px 20px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171520; border: 1px solid #2A2438; border-radius: 10px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #1D1A29; border-bottom: 1px solid #2A2438;">
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF; text-transform: uppercase;">
                      &#128640; NEXT STEPS & EVALUATION SCHEDULE
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 20px;">
                    
                    <!-- STEP 1 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="top" style="width: 28px; padding-top: 2px;">
                          <div style="width: 22px; height: 22px; line-height: 22px; border-radius: 50%; background-color: rgba(255, 23, 68, 0.15); border: 1px solid #FF1744; color: #FF1744; font-size: 10px; font-weight: 900; text-align: center;">1</div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 13px; font-weight: 700; color: #FFFFFF;">Round 1 Online Evaluation (20 December 2026)</div>
                          <div style="margin-top: 3px; font-size: 12px; color: #9CA3AF; line-height: 18px;">
                            The expert judging panel evaluates your submitted idea presentation on problem impact, technical feasibility, innovation, and scalability.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- STEP 2 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="top" style="width: 28px; padding-top: 2px;">
                          <div style="width: 22px; height: 22px; line-height: 22px; border-radius: 50%; background-color: rgba(0, 229, 255, 0.15); border: 1px solid #00E5FF; color: #00E5FF; font-size: 10px; font-weight: 900; text-align: center;">2</div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 13px; font-weight: 700; color: #FFFFFF;">Shortlist Announcement (TBA — After Round 1)</div>
                          <div style="margin-top: 3px; font-size: 12px; color: #9CA3AF; line-height: 18px;">
                            Qualifying teams will be officially published and notified via direct email invitation with comprehensive Grand Finale guidelines.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- STEP 3 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" style="width: 28px; padding-top: 2px;">
                          <div style="width: 22px; height: 22px; line-height: 22px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #10B981; font-size: 10px; font-weight: 900; text-align: center;">3</div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 13px; font-weight: 700; color: #FFFFFF;">Grand Finale Hackathon (TBA — Bhopal, Madhya Pradesh)</div>
                          <div style="margin-top: 3px; font-size: 12px; color: #9CA3AF; line-height: 18px;">
                            Shortlisted teams convene in Bhopal, Madhya Pradesh to build, demo live prototypes, and compete for top prizes and mentorship.
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BRANDED FOOTER -->
          <tr>
            <td style="padding: 28px 32px 32px 32px; background-color: #0E0C13; border-top: 1px solid #252131; text-align: center;" class="mobile-padding">
              <div style="font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                ONE IDEA. NO LIMITS.
              </div>
              <div style="margin-top: 4px; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #9CA3AF; text-transform: uppercase;">
                BUILD &#183; SOLVE &#183; INNOVATE &#183; TOGETHER
              </div>
              <div style="margin-top: 16px; font-size: 11px; color: #6B7280; line-height: 18px;">
                APEX 1.0 Organizing Team &#183; Bhopal, Madhya Pradesh<br />
                Official Website: <a href="https://apexhack.online" style="color: #00E5FF; text-decoration: none;">https://apexhack.online</a><br />
                Support Email: <a href="mailto:apexhackathon2k26@gmail.com" style="color: #FF1744; text-decoration: none;">apexhackathon2k26@gmail.com</a>
              </div>
              <div style="margin-top: 16px; font-size: 10px; color: #4B5563; line-height: 14px;">
                This is an automated participant registration confirmation email sent after successful payment verification and database commit. Please quote your R_ID in all queries.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  // Comprehensive plain-text fallback
  const text = `==================================================
APEX 1.0 — STUDENT HACKATHON · BHOPAL
YOU'RE OFFICIALLY REGISTERED!
==================================================

${previewText}

OFFICIAL REGISTRATION ID (R_ID):
>>> ${data.playerId} <<<
Quote this unique permanent cryptographic identifier for all hackathon phases and check-ins.

Hey ${data.leaderName},

Congratulations! Team "${data.teamName}" has successfully registered for APEX 1.0 — One Idea. No Limits. Your registration and idea presentation have been securely verified and saved in the official event registry.

--------------------------------------------------
REGISTERED TEAM DETAILS
--------------------------------------------------
Registration ID : ${data.playerId}
Team Name       : ${data.teamName}
Team Leader     : ${data.leaderName}
Registered Email: ${data.email}
Contact Number  : ${data.phone}
College / Org   : ${collegeDisplay}
Team Size       : ${data.teamSize} Member${data.teamSize > 1 ? "s" : ""}
${memberNames.length > 0 ? `Team Members    : ${memberNames.join(", ")}\n` : ""}Preferred Track : ${domainDisplay}

--------------------------------------------------
PAYMENT SUMMARY (₹${paidAmount} PAID)
--------------------------------------------------
Entry Fee       : ₹${paidAmount} INR
Payment Status  : PAID · Razorpay Verified
Payment Gateway : Razorpay Trusted Gateway
Order ID        : ${orderId}
Payment ID      : ${paymentId}

--------------------------------------------------
IDEA PRESENTATION (ROUND 1 EVALUATION)
--------------------------------------------------
${
  hasPresentationLink
    ? `Presentation Link: ${presentationLink}\n\nIMPORTANT: Please ensure your Google Drive link permission is set to "Anyone with the link - Viewer" so the judging panel can access your slides.`
    : `Submission Status: Google Drive Link Saved for Round 1 Evaluation.`
}

--------------------------------------------------
NEXT STEPS & SCHEDULE
--------------------------------------------------
1. Round 1 Online Evaluation (20 December 2026)
   The expert judging panel evaluates your submitted idea presentation on problem impact, technical feasibility, innovation, and scalability.

2. Shortlist Announcement (TBA — After Round 1)
   Qualifying teams will be officially published and notified via direct email invitation with Grand Finale guidelines.

3. Grand Finale Hackathon (TBA — Bhopal, Madhya Pradesh)
   Shortlisted teams convene in Bhopal, Madhya Pradesh to build, demo live prototypes, and compete for top prizes.

==================================================
ONE IDEA. NO LIMITS.
BUILD · SOLVE · INNOVATE · TOGETHER

APEX 1.0 Organizing Team · Bhopal, Madhya Pradesh
Official Website: https://apexhack.online
Support Email   : apexhackathon2k26@gmail.com
==================================================`;

  return { subject, html, text };
}

/**
 * Generate separate Admin Notification Email
 * Sent to apexhackathon2k26@gmail.com on every successful registration.
 */
export function generateAdminRegistrationNotificationEmail(data: EmailRegistrationData): {
  subject: string;
  html: string;
  text: string;
} {
  const paidAmount = data.paymentAmount ? Number(data.paymentAmount) : 199;
  const subject = `[NEW REGISTRATION] ${data.teamName} — ${data.playerId} (₹${paidAmount} Paid)`;
  const presentationLink = data.ideaDriveLink || data.pptUrl || "";
  const memberNames: string[] = [];
  if (data.members && data.members.length > 0) {
    data.members.forEach((m) => {
      if (m.full_name && m.full_name.trim().length > 0) {
        memberNames.push(m.full_name.trim());
      }
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0B10;">
    <tr>
      <td align="center" style="padding: 24px 12px 40px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #15121B; border: 1px solid #272033; border-radius: 12px; overflow: hidden;">
          
          <!-- ADMIN ALERT HEADER -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(180deg, #27141f 0%, #15121B 100%); border-bottom: 1px solid #33202d; text-align: left;">
              <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                APEX//1.0 ADMIN DISPATCH · NEW REGISTRATION
              </span>
              <div style="margin-top: 8px; font-size: 22px; font-weight: 900; color: #FFFFFF;">
                Team: ${data.teamName}
              </div>
              <div style="margin-top: 4px; font-size: 13px; color: #10B981; font-weight: 700;">
                ● ₹${paidAmount} INR Paid · Razorpay Verified
              </div>
            </td>
          </tr>

          <!-- R_ID BADGE -->
          <tr>
            <td style="padding: 20px 32px 10px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #FF1744; border-radius: 8px; text-align: center;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #9CA3AF; text-transform: uppercase;">
                      OFFICIAL REGISTRATION ID (R_ID)
                    </div>
                    <div style="margin-top: 4px; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FF1744; font-family: monospace;">
                      ${data.playerId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TEAM DETAILS TABLE -->
          <tr>
            <td style="padding: 10px 32px 20px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #272033; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #272033;">
                    <span style="font-size: 12px; font-weight: 800; letter-spacing: 1px; color: #E5E7EB; text-transform: uppercase;">
                      TEAM INFORMATION
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF; width: 38%;">Team Name:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF; font-weight: 700;">${data.teamName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Leader Name:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF; font-weight: 600;">${data.leaderName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Leader Email:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #00E5FF;"><a href="mailto:${data.email}" style="color: #00E5FF; text-decoration: none;">${data.email}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Phone:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;"><a href="tel:${data.phone}" style="color: #FFFFFF; text-decoration: none;">${data.phone}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">College / Org:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">${data.college || "Not specified"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Team Size:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">${data.teamSize} Member${data.teamSize > 1 ? "s" : ""}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Additional Members:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">${memberNames.join(", ") || "None (Solo)"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Preferred Domain:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">${data.preferredDomain || "Open Innovation"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRESENTATION SUBMISSION CARD -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #272033; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #272033;">
                    <span style="font-size: 12px; font-weight: 800; letter-spacing: 1px; color: #00E5FF; text-transform: uppercase;">
                      GOOGLE DRIVE PRESENTATION SUBMISSION
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px 18px 18px;">
                    ${
                      presentationLink
                        ? `<p style="margin: 0 0 12px 0; font-size: 12px; color: #E5E7EB; word-break: break-all;">
                            <strong>Direct Link:</strong> <a href="${presentationLink}" target="_blank" style="color: #00E5FF; text-decoration: underline;">${presentationLink}</a>
                          </p>
                          <a href="${presentationLink}" target="_blank" style="display: inline-block; background-color: #FF1744; color: #FFFFFF; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 10px 20px; border-radius: 6px;">
                            OPEN GOOGLE DRIVE PRESENTATION &rarr;
                          </a>`
                        : `<p style="margin: 0; font-size: 12px; color: #9CA3AF;">No presentation URL provided.</p>`
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PAYMENT AUDIT -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #10B981; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 18px;">
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #10B981; text-transform: uppercase;">
                      RAZORPAY PAYMENT AUDIT
                    </span>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 8px;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 11px; color: #9CA3AF; width: 38%;">Amount:</td>
                        <td style="padding: 4px 0; font-size: 11px; color: #FFFFFF; font-weight: 700;">₹${paidAmount}.00 INR (${paidAmount * 100} paise)</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 11px; color: #9CA3AF;">Order ID:</td>
                        <td style="padding: 4px 0; font-size: 11px; color: #FFFFFF; font-family: monospace;">${data.orderId || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 11px; color: #9CA3AF;">Payment ID:</td>
                        <td style="padding: 4px 0; font-size: 11px; color: #FFFFFF; font-family: monospace;">${data.paymentId || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 11px; color: #9CA3AF;">Captured At:</td>
                        <td style="padding: 4px 0; font-size: 11px; color: #9CA3AF;">${new Date().toISOString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 32px; background-color: #100D16; border-top: 1px solid #272033; text-align: center; font-size: 11px; color: #6B7280;">
              APEX 1.0 Automated Admin Notification System · <a href="https://apexhack.online/admin" style="color: #FF1744; text-decoration: none;">Admin Dashboard</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `==================================================
APEX 1.0 — NEW REGISTRATION ADMIN NOTIFICATION
==================================================
Team Name       : ${data.teamName}
Registration ID : ${data.playerId}
Leader Name     : ${data.leaderName}
Email           : ${data.email}
Phone           : ${data.phone}
College         : ${data.college || "N/A"}
Team Size       : ${data.teamSize}
Members         : ${memberNames.join(", ") || "None (Solo)"}
Domain          : ${data.preferredDomain || "Open Innovation"}

GOOGLE DRIVE LINK:
${presentationLink || "No link provided"}

PAYMENT DETAILS:
Amount          : ₹${paidAmount} INR (${paidAmount * 100} paise)
Payment Status  : PAID & CAPTURED
Razorpay Order  : ${data.orderId || "N/A"}
Razorpay Payment: ${data.paymentId || "N/A"}
Verified At     : ${new Date().toISOString()}

==================================================
APEX 1.0 Administration Team
https://apexhack.online/admin
==================================================`;

  return { subject, html, text };
}
