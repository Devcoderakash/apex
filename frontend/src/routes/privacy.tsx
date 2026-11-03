import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cookie,
  Database,
  Eye,
  FileCheck,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  Scale,
  Server,
  Share2,
  Shield,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — APEX 1.0 National Hackathon" },
      {
        name: "description",
        content:
          "Official Privacy Policy of APEX 1.0 organized by The Innovation League, Bhopal. Formulated in compliance readiness with the Digital Personal Data Protection Act (DPDP Act), 2023.",
      },
      { property: "og:title", content: "Privacy Policy — APEX 1.0" },
      {
        property: "og:description",
        content: "Complete 13-section DPDP Act 2023 ready privacy policy for APEX 1.0.",
      },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

const PRIVACY_SECTIONS = [
  {
    icon: Database,
    code: "PRIVACY_01",
    title: "1. Information We Collect",
    clauses: [
      "Personal Identity & Contact Data: Team Leader and teammate full names, email addresses, phone/mobile numbers, college/institution, and academic details.",
      "Project & Submission Information: Project title, description, problem statement, proposed architecture, technology stack, and uploaded presentation decks (PPT/PDF).",
      "Links and Portfolio Profiles: GitHub repository URLs, LinkedIn profile links, demo URLs, and portfolio links entered as text.",
      "Technical & Usage Telemetry: IP address, browser type, operating system, timestamp of access, and referral data captured automatically via secure server access logs.",
      "Consent Evidence: Granular purpose-specific consent logs (timestamp, IP, policy version, status) captured pursuant to the Digital Personal Data Protection Act, 2023.",
    ],
  },
  {
    icon: Eye,
    code: "PRIVACY_02",
    title: "2. How We Use Information",
    clauses: [
      "To administer team registrations, issue official sequential Player IDs (APEX-XXXX), and manage event operations.",
      "To facilitate online pitch screening and evaluation by our designated expert judging panel.",
      "To communicate essential event schedules, shortlist announcements, and Grand Finale instructions to team leaders.",
      "To process payments, verify transactions, prevent fraudulent duplicate registrations, and generate financial audit receipts.",
      "To dispatch optional marketing, promotional updates, or partner announcements strictly subject to prior unbundled affirmative consent.",
    ],
  },
  {
    icon: Lock,
    code: "PRIVACY_03",
    title: "3. Payment Processing",
    clauses: [
      "Registration payments (₹199 per team) are processed securely via Razorpay Software Private Limited, an authorized Payment Aggregator regulated by the Reserve Bank of India (RBI).",
      "APEX 1.0 does NOT store, collect, or process full credit/debit card numbers, CVVs, net-banking passwords, or UPI MPINs on our servers.",
      "Payment integrity is guaranteed using server-side HMAC-SHA256 signature verification over Razorpay orders.",
      "We retain only transaction references (order ID, payment ID, timestamp, and verification status) for accounting, taxation, and refund audits.",
    ],
  },
  {
    icon: Share2,
    code: "PRIVACY_04",
    title: "4. Information Sharing and Disclosure",
    clauses: [
      "We do not sell, rent, monetize, or trade participant personal data to third parties.",
      "Information is shared strictly on a need-to-know basis with trusted service processors: Supabase (cloud database & storage), Razorpay (payments), Vercel & Render (hosting), and Resend (transactional email dispatch).",
      "Evaluation data (project descriptions and pitch decks) is shared with authorized judges under non-disclosure obligations.",
      "We may disclose data when required by Indian law, judicial summons, or directives from CERT-In / Data Protection Board of India.",
    ],
  },
  {
    icon: FileText,
    code: "PRIVACY_05",
    title: "5. Project Submissions and Publicity",
    clauses: [
      "Participants retain 100% intellectual property ownership of their submitted pitch decks, prototypes, and code.",
      "Organizers may publicly showcase project titles, high-level problem statements, demo videos, and winner photos across our official website https://apexhack.online and social channels.",
      "Private source code, internal contact details, and proprietary implementation notes remain confidential.",
    ],
  },
  {
    icon: Server,
    code: "PRIVACY_06",
    title: "6. Data Storage and Security",
    clauses: [
      "Data is stored in cloud databases and object storage with Row-Level Security (RLS) policies and encrypted connections (TLS 1.3 / HTTPS).",
      "Presentation decks are stored in cloud object storage with time-limited signed URLs (1-hour expiration) preventing public crawling.",
      "Administrative access is restricted to verified organizers with role-based access control (RBAC).",
      "Regular automated audits and security hardening are implemented in line with CERT-In cybersecurity best practices.",
    ],
  },
  {
    icon: RefreshCw,
    code: "PRIVACY_07",
    title: "7. Data Retention",
    clauses: [
      "Active event data is retained through the duration of APEX 1.0, shortlisting, finale execution, and prize disbursal.",
      "Post-event, financial transaction records are retained for statutory periods required under Indian tax and accounting laws.",
      "Personal data not subject to statutory retention mandates is archived or securely deleted upon conclusion of the competition cycle or upon verified erasure request.",
    ],
  },
  {
    icon: UserCheck,
    code: "PRIVACY_08",
    title: "8. Privacy Rights under DPDP Act, 2023",
    clauses: [
      "Right to Access: Participants may request a summary of personal data being processed and identities of processing entities.",
      "Right to Correction & Updating: Participants can request correction of inaccurate, misleading, or outdated personal information.",
      "Right to Erasure: Participants may request deletion of personal data, subject to ongoing legal or event obligations.",
      "Right to Withdraw Consent: Participants may withdraw previously granted optional marketing or promotional consent at any time via our Consent Center.",
      "Right of Grievance Redressal: Access to an expeditious grievance mechanism before approaching the Data Protection Board of India.",
    ],
  },
  {
    icon: Cookie,
    code: "PRIVACY_09",
    title: "9. Cookies and Technical Tracking",
    clauses: [
      "We use strictly necessary session cookies essential for secure navigation, form submission, and CSRF protection.",
      "Non-essential analytical or functional cookies are deactivated by default and load only upon affirmative consent via our Cookie Banner.",
      "Participants can update or revoke cookie preferences at any time through our dedicated Cookie Policy & Consent Center.",
    ],
  },
  {
    icon: FileCheck,
    code: "PRIVACY_10",
    title: "10. Third-Party Links",
    clauses: [
      "Our website contains links to third-party domains (e.g., GitHub, LinkedIn, Razorpay, colleges).",
      "We are not responsible for the privacy practices, content, or data protection standards of external sites. We encourage reviewing their respective policies.",
    ],
  },
  {
    icon: Shield,
    code: "PRIVACY_11",
    title: "11. Children's and Minors' Privacy",
    clauses: [
      "APEX 1.0 is intended for college and university students. If any participant is under 18 years of age, participation requires verifiable parental or lawful guardian consent in accordance with Section 9 of the DPDP Act, 2023.",
      "We do not engage in targeted advertising or behavioral tracking of minors.",
    ],
  },
  {
    icon: Scale,
    code: "PRIVACY_12",
    title: "12. Policy Updates",
    clauses: [
      "The Innovation League reserves the right to amend this Privacy Policy to reflect evolving regulatory frameworks or platform enhancements.",
      "Material modifications will be notified prominently on https://apexhack.online/privacy with an updated effective revision date.",
    ],
  },
  {
    icon: Mail,
    code: "PRIVACY_13",
    title: "13. Contact, Grievance Officer & Privacy Requests",
    clauses: [
      "Data Fiduciary: The Innovation League, Bhopal.",
      "Official Event Website: https://apexhack.online.",
      "Grievance Officer (DPDP Act Compliance): Contact designated officer via privacy@apexhack.online (Placeholder for designated officer).",
      "Dedicated Privacy Request Portal: https://apexhack.online/privacy-requests for data access, correction, and erasure.",
      "Grievance Portal: https://apexhack.online/grievance (Complaints resolved within 30 days pursuant to DPDP guidelines).",
    ],
  },
];

function PrivacyPage() {
  return (
    <>
      <PageHeader
        code="SYSTEM_08 / PRIVACY"
        title="Privacy Policy"
        subtitle="Formulated in compliance readiness with the Digital Personal Data Protection Act (DPDP Act), 2023. Organizer: The Innovation League, Bhopal."
      />

      {/* DPDP Act 2023 Compliance Notice Banner */}
      <Section className="py-4">
        <Reveal>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 sm:p-6 text-xs sm:text-sm text-foreground">
            <div className="flex items-start gap-3.5">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-sm sm:text-base text-primary uppercase tracking-wider">
                  DPDP ACT, 2023 COMPLIANCE COMMITMENT
                </p>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  The Innovation League processes participant personal data strictly for specified, legitimate hackathon management purposes based on informed consent and fair processing principles. You have statutory rights to access, correct, erase your personal data, or withdraw optional consent at any time.
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <Link to="/privacy-requests">
                    <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
                      SUBMIT PRIVACY REQUEST (ACCESS / ERASURE) →
                    </Button>
                  </Link>
                  <Link to="/grievance">
                    <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
                      GRIEVANCE REDRESSAL →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 13 Official Sections */}
      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {PRIVACY_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.code}
                  className="glass-panel relative flex flex-col justify-between rounded-xl border border-border/50 p-6 sm:p-7 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
                          {sec.title}
                        </h2>
                      </div>
                      <SystemLabel className="text-primary text-[0.65rem]">{sec.code}</SystemLabel>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {sec.clauses.map((clause, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Section>
    </>
  );
}
