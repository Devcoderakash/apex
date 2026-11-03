import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCode,
  Globe,
  HelpCircle,
  Landmark,
  Scale,
  Shield,
  Trophy,
  Users,
  Calendar,
  Layers,
  FileText,
  Mail,
} from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — APEX 1.0 National Hackathon" },
      {
        name: "description",
        content:
          "Official Terms and Conditions for APEX 1.0 organized by The Innovation League, Bhopal. Covering eligibility, fees, intellectual property, refunds, and governing law.",
      },
      { property: "og:title", content: "Terms and Conditions — APEX 1.0" },
      {
        property: "og:description",
        content: "Official 15-section participation terms and legal guidelines for APEX 1.0.",
      },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

const TERMS_SECTIONS = [
  {
    icon: Building2,
    code: "TERMS_01",
    title: "1. Organizer",
    clauses: [
      "APEX 1.0 National Hackathon is organized and conducted by The Innovation League, Bhopal.",
      "The official website for all registrations, updates, submissions, and official communications is https://apexhack.online.",
      "By accessing the platform or registering a team, you enter into a binding agreement with the organizer under these Terms.",
    ],
  },
  {
    icon: Users,
    code: "TERMS_02",
    title: "2. Eligibility",
    clauses: [
      "Participation is open to currently enrolled undergraduate, postgraduate, or diploma students from recognized academic institutions.",
      "Teams must consist of 1 to 4 members. Every team must designate exactly one Team Leader.",
      "One participant cannot belong to multiple teams. Any participant found enrolled in more than one team will face immediate disqualification.",
      "Valid student identification or enrollment verification may be required during the event lifecycle.",
    ],
  },
  {
    icon: Landmark,
    code: "TERMS_03",
    title: "3. Registration and Fees",
    clauses: [
      "The registration fee for Round 1 (Online Submission Round) is fixed at ₹199 per team.",
      "Registration is complete only upon successful online payment through our authorized payment gateway (Razorpay) and complete submission of required registration details.",
      "Upon payment confirmation, teams receive an official Player ID (e.g., APEX-1001) which must be quoted in all correspondence.",
    ],
  },
  {
    icon: Scale,
    code: "TERMS_04",
    title: "4. Cancellation and Refunds",
    clauses: [
      "Registration fees are strictly non-refundable once an order is verified and confirmed, as operational resources and evaluation slots are immediately allocated.",
      "In the event of duplicate payment debits resulting from technical payment gateway failures, the excess transaction will be refunded upon verification.",
      "Refund claims must be initiated within 7 days of transaction by writing to our official contact with transaction receipts.",
      "Detailed terms are governed by our Refund and Cancellation Policy.",
    ],
  },
  {
    icon: Calendar,
    code: "TERMS_05",
    title: "5. Event Schedule and Venue",
    clauses: [
      "Online Submission Round deadline: 25 November 2026 (23:59 IST).",
      "Shortlisted Teams Announcement: 30 November 2026.",
      "Grand Finale: 10 December 2026 in Bhopal, Madhya Pradesh (exact venue communicated to shortlisted teams).",
      "The organizer reserves the right to alter schedule timings with reasonable notice published on https://apexhack.online.",
    ],
  },
  {
    icon: FileText,
    code: "TERMS_06",
    title: "6. Participant Responsibilities",
    clauses: [
      "Participants are responsible for the accuracy of all submitted details, emails, mobile numbers, and presentation files.",
      "Participants must adhere to ethical standards, professional conduct, and the APEX 1.0 Code of Conduct throughout the event.",
      "Shortlisted teams are responsible for their own travel, transit, and personal devices when attending the offline Grand Finale.",
    ],
  },
  {
    icon: FileCode,
    code: "TERMS_07",
    title: "7. Intellectual Property",
    clauses: [
      "Participants retain 100% ownership of all intellectual property, source code, designs, and algorithms created for APEX 1.0.",
      "All submissions must represent original work. Proper attribution must be provided for any open-source components used.",
      "Participants grant the organizer a non-exclusive, royalty-free license to feature project titles, summaries, and demo videos for promotional and archival purposes.",
    ],
  },
  {
    icon: Trophy,
    code: "TERMS_08",
    title: "8. Judging and Prizes",
    clauses: [
      "Total prize pool is ₹30,000 (First: ₹15,000, Second: ₹10,000, Third: ₹5,000).",
      "Evaluation is conducted independently across 7 dimensions by industry mentors and academic evaluators.",
      "The decisions of the judging panel and organizers regarding evaluation, scoring, shortlisting, and awards are final, conclusive, and non-appealable.",
      "Prizes will be transferred to the verified account of the designated Team Leader following identity and eligibility verification.",
    ],
  },
  {
    icon: Globe,
    code: "TERMS_09",
    title: "9. Online Participation",
    clauses: [
      "Physical participation in Bhopal on 10 December 2026 is expected for all shortlisted teams.",
      "Online presentation may be requested with prior organizer approval under exceptional circumstances. It is not automatically guaranteed.",
      "Teams granted online permission must ensure adequate internet connectivity and audio-visual equipment during live judging.",
    ],
  },
  {
    icon: Shield,
    code: "TERMS_10",
    title: "10. Limitation of Liability",
    clauses: [
      "To the maximum extent permitted by applicable Indian law, The Innovation League shall not be liable for indirect, incidental, or consequential damages.",
      "The organizer is not liable for technical failures of third-party payment gateways, telecommunication outages, or transport disruptions.",
      "Our aggregate liability in all circumstances is limited to the registration fee actually paid by the participant.",
    ],
  },
  {
    icon: AlertTriangle,
    code: "TERMS_11",
    title: "11. Disqualification and Termination",
    clauses: [
      "The organizer reserves the absolute right to disqualify any team for plagiarism, code of conduct violations, false enrollment claims, or harassment.",
      "Disqualified teams forfeit all eligibility for prizes, shortlisting, and refunds.",
    ],
  },
  {
    icon: Layers,
    code: "TERMS_12",
    title: "12. Third-Party Services",
    clauses: [
      "APEX 1.0 utilizes trusted third-party providers including Razorpay (payment processing), Supabase (cloud database & storage), and Vercel/Render (hosting).",
      "Use of these third-party services is subject to their respective terms and privacy policies.",
    ],
  },
  {
    icon: HelpCircle,
    code: "TERMS_13",
    title: "13. Changes to Terms",
    clauses: [
      "The organizer reserves the right to amend or update these Terms & Conditions at any time.",
      "Material modifications will be posted with an updated effective date on https://apexhack.online/terms.",
      "Continued use of the website following amendments constitutes acceptance of the updated terms.",
    ],
  },
  {
    icon: Scale,
    code: "TERMS_14",
    title: "14. Governing Law and Jurisdiction",
    clauses: [
      "These Terms shall be governed by, construed, and enforced in accordance with the laws of India.",
      "Any legal proceedings or disputes arising under or in connection with APEX 1.0 shall be subject to the exclusive jurisdiction of the competent courts in Bhopal, Madhya Pradesh, India.",
    ],
  },
  {
    icon: Mail,
    code: "TERMS_15",
    title: "15. Contact & Grievance Redressal",
    clauses: [
      "For general event queries, support, or complaints, please reach out through our official channels.",
      "Official website: https://apexhack.online.",
      "Dedicated Grievance Portal: https://apexhack.online/grievance.",
      "DPDP Privacy Officer contact: privacy@apexhack.online (Placeholder for designated officer).",
    ],
  },
];

function TermsPage() {
  return (
    <>
      <PageHeader
        code="SYSTEM_07 / TERMS"
        title="Terms & Conditions"
        subtitle="Official 15-section terms of participation, eligibility, intellectual property, and legal protocols for APEX 1.0. Organizer: The Innovation League, Bhopal."
      />

      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {TERMS_SECTIONS.map((sec) => {
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

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/40 p-6">
            <div>
              <p className="font-display text-base font-bold text-foreground">HAVE QUESTIONS ABOUT OUR POLICIES?</p>
              <p className="text-xs text-muted-foreground mt-1">Review our comprehensive privacy framework, cookie policy, or submit a grievance.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link to="/privacy">
                <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
                  PRIVACY POLICY →
                </Button>
              </Link>
              <Link to="/rules">
                <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
                  RULES PROTOCOL →
                </Button>
              </Link>
              <Link to="/grievance">
                <Button size="sm" className="font-mono text-xs tracking-wider">
                  GRIEVANCE PORTAL →
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
