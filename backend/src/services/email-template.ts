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
  const subject = `Registration Confirmed — APEX//1.0 | ${data.playerId}`;

  // Format team members list
  const memberNames: string[] = [];
  if (data.members && data.members.length > 0) {
    data.members.forEach((m) => {
      if (m.full_name && m.full_name.trim().length > 0) {
        memberNames.push(m.full_name.trim());
      }
    });
  }

  // Format presentation status
  const presentationLink = data.ideaDriveLink || data.pptUrl;
  const presentationStatus = presentationLink
    ? "Google Drive Link Attached (Round 1 Evaluation)"
    : Boolean(data.pptStoragePath || data.pptFileName)
    ? `Submitted ${data.pptFileName ? `(${data.pptFileName})` : "for Evaluation"}`
    : "Submission Pending";

  // Format payment status
  const isPaid =
    data.paymentStatus === "paid" ||
    data.paymentStatus === "confirmed" ||
    Boolean(data.paymentId);
  const paidAmount = data.paymentAmount ? Number(data.paymentAmount) : 10;
  const paymentDisplay = isPaid
    ? `Paid (₹${paidAmount}) · Razorpay Verified`
    : "Fee Cleared / Confirmed";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #0B0B10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Email Container -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0B10;">
    <tr>
      <td align="center" style="padding: 24px 12px 40px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #15121B; border: 1px solid #272033; border-radius: 12px; overflow: hidden;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(180deg, #1d1427 0%, #15121B 100%); border-bottom: 1px solid #272033; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                      APEX<span style="color: #FFFFFF;">//</span>1.0
                    </span>
                    <div style="margin-top: 6px; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #9CA3AF; text-transform: uppercase;">
                      STUDENT HACKATHON · BHOPAL
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SUCCESS BANNER -->
          <tr>
            <td style="padding: 28px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); border: 1px solid #10B981; color: #10B981; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px;">
                ● REGISTRATION SUCCESSFUL
              </div>
              <h1 style="margin: 18px 0 6px 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF; text-transform: uppercase;">
                YOUR JOURNEY STARTS HERE.
              </h1>
              <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 20px;">
                Your registration has been securely validated and recorded in the official event database.
              </p>
            </td>
          </tr>

          <!-- REGISTRATION ID CARD -->
          <tr>
            <td style="padding: 12px 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 23, 68, 0.06); border: 1px solid rgba(255, 23, 68, 0.4); border-radius: 8px; text-align: center;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                      OFFICIAL REGISTRATION ID
                    </div>
                    <div style="margin-top: 6px; font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #FF1744; font-family: 'Courier New', Courier, monospace;">
                      ${data.playerId}
                    </div>
                    <div style="margin-top: 4px; font-size: 11px; color: #9CA3AF;">
                      Quote this unique identifier for all official communications
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PERSONALIZED GREETING -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #FFFFFF;">
                Hey ${data.leaderName},
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #E5E7EB;">
                Congratulations! Your team has successfully registered for <strong>APEX//1.0 — One Idea. No Limits.</strong>
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #9CA3AF;">
                Your registration details have been recorded. Get ready to showcase your idea, solve real-world problems, and compete with innovative minds.
              </p>
            </td>
          </tr>

          <!-- TEAM DETAILS SECTION -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #272033; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #272033;">
                    <span style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: #FF1744; text-transform: uppercase;">
                      REGISTERED TEAM DETAILS
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; width: 40%;">Registration ID:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF; font-weight: 700; font-family: monospace;">${data.playerId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Team Name:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF; font-weight: 700;">${data.teamName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Team Leader:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.leaderName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Registered Email:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Contact Number:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.phone}</td>
                      </tr>
                      ${
                        data.college && data.college.trim().length > 0
                          ? `<tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">College / Org:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.college.trim()}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Team Size:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.teamSize} Member${data.teamSize > 1 ? "s" : ""}</td>
                      </tr>
                      ${
                        memberNames.length > 0
                          ? `<tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; vertical-align: top;">Team Members:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${memberNames.join(", ")}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        data.preferredDomain && data.preferredDomain.trim().length > 0
                          ? `<tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Preferred Domain:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #FFFFFF;">${data.preferredDomain.trim()}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Idea Presentation:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #00E5FF; font-weight: 600;">
                          ${
                            presentationLink
                              ? `<a href="${presentationLink}" target="_blank" style="color: #00E5FF; text-decoration: underline;">Google Drive Presentation Link &rarr;</a>`
                              : presentationStatus
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF;">Payment Status:</td>
                        <td style="padding: 6px 0; font-size: 12px; color: #10B981; font-weight: 700;">${paymentDisplay}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EVENT DETAILS SECTION -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0C13; border: 1px solid #272033; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #272033;">
                    <span style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">
                      EVENT SCHEDULE & FORMAT
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF; width: 40%;">Event:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF; font-weight: 600;">APEX 1.0 National Hackathon</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Organizer:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">The Innovation League, Bhopal</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Official Website:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #00E5FF;"><a href="https://apexhack.online" style="color: #00E5FF; text-decoration: none;">https://apexhack.online</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Online Submission:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FF1744; font-weight: 700;">25 November 2026</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Shortlist Announcement:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">30 November 2026</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Grand Finale:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #10B981; font-weight: 700;">10 December 2026</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 12px; color: #9CA3AF;">Finale Venue:</td>
                        <td style="padding: 5px 0; font-size: 12px; color: #FFFFFF;">Bhopal, Madhya Pradesh (Communicated to shortlisted teams)</td>
                      </tr>
                    </table>
                    <div style="margin-top: 12px; padding: 10px 12px; background-color: rgba(0, 229, 255, 0.05); border-left: 2px solid #00E5FF; font-size: 11px; color: #E5E7EB; line-height: 17px;">
                      Your submission will be evaluated across Innovation, Technical Implementation, Practical Feasibility, and Presentation. Physical participation is expected for the Grand Finale; online presentation may be requested with prior organizer approval.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- IMPORTANT NOTICE -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 23, 68, 0.04); border: 1px solid rgba(255, 23, 68, 0.2); border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #FF1744; text-transform: uppercase;">
                      IMPORTANT NOTICE
                    </div>
                    <div style="margin-top: 4px; font-size: 12px; color: #D1D5DB; line-height: 18px;">
                      Please keep your Registration ID safe for future communication. This email confirms registration; it does not guarantee shortlisting or selection for the finale.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BRANDED FOOTER -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background-color: #100D16; border-top: 1px solid #272033; text-align: center;">
              <div style="font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #FF1744; text-transform: uppercase;">
                ONE IDEA. NO LIMITS.
              </div>
              <div style="margin-top: 4px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #9CA3AF; text-transform: uppercase;">
                BUILD. SOLVE. INNOVATE. TOGETHER.
              </div>
              <div style="margin-top: 14px; font-size: 11px; color: #6B7280; line-height: 18px;">
                APEX//1.0 Organizing Team<br />
                Bhopal, Madhya Pradesh<br />
                <a href="mailto:apexhackathon2k26@gmail.com" style="color: #FF1744; text-decoration: none;">apexhackathon2k26@gmail.com</a>
              </div>
              <div style="margin-top: 16px; font-size: 10px; color: #4B5563;">
                This is an automated registration confirmation email. Please contact the organizing team for assistance.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Clean, high-readability plain-text version
  const text = `==================================================
APEX//1.0 — STUDENT HACKATHON · BHOPAL
REGISTRATION CONFIRMED
==================================================

OFFICIAL REGISTRATION ID: ${data.playerId}

Hey ${data.leaderName},

Congratulations! Your team has successfully registered for APEX//1.0 — One Idea. No Limits.

Your registration details have been recorded. Get ready to showcase your idea, solve real-world problems, and compete with innovative minds.

--------------------------------------------------
REGISTERED TEAM DETAILS
--------------------------------------------------
Registration ID : ${data.playerId}
Team Name       : ${data.teamName}
Team Leader     : ${data.leaderName}
Registered Email: ${data.email}
Contact Number  : ${data.phone}
${data.college ? `College / Org   : ${data.college}\n` : ""}Team Size       : ${data.teamSize} Member${data.teamSize > 1 ? "s" : ""}
${memberNames.length > 0 ? `Team Members    : ${memberNames.join(", ")}\n` : ""}${data.preferredDomain ? `Domain          : ${data.preferredDomain}\n` : ""}Presentation    : ${presentationLink || presentationStatus}
Payment Status  : ${paymentDisplay}

--------------------------------------------------
EVENT SCHEDULE & FORMAT
--------------------------------------------------
Event           : APEX 1.0 National Hackathon
Organizer       : The Innovation League, Bhopal
Official Website: https://apexhack.online
Online Sub. Date: 25 November 2026
Shortlist Date  : 30 November 2026
Grand Finale    : 10 December 2026
Location        : Bhopal, Madhya Pradesh (Communicated to shortlisted teams)

Your idea will be evaluated across Innovation, Technical Implementation, Feasibility, and Presentation. Physical participation is expected for the Grand Finale; online presentation may be requested with prior organizer approval.

--------------------------------------------------
IMPORTANT NOTICE
--------------------------------------------------
Please keep your Registration ID safe for future communication. This email confirms registration; it does not guarantee shortlisting or selection for the finale.

==================================================
ONE IDEA. NO LIMITS.
BUILD. SOLVE. INNOVATE. TOGETHER.

The Innovation League, Bhopal
Official Website: https://apexhack.online
Support Email   : apexhackathon2k26@gmail.com

This is an automated registration confirmation email. Please contact the organizing team for assistance.
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
  const subject = `[NEW REGISTRATION] ${data.teamName} — ${data.playerId} (₹10 Paid)`;
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
                ● ₹10 INR Paid · Razorpay Verified
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
                        <td style="padding: 4px 0; font-size: 11px; color: #FFFFFF; font-weight: 700;">₹10.00 INR (1000 paise)</td>
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
Amount          : ₹10 INR (1000 paise)
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
