import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  FileCode,
  Shield,
  Trophy,
  Users,
  AlertTriangle,
  Scale,
  Sparkles,
  MapPin,
  Cpu,
  BookOpen,
  FileText,
  HelpCircle,
} from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SectionHeading, SystemLabel } from "@/components/site/bits";
import { EVALUATION_CRITERIA, EVENT_DETAILS } from "@/shared/data/apex";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules & Regulations — APEX 1.0 National Hackathon" },
      {
        name: "description",
        content:
          "Official rules, guidelines, eligibility criteria, and code of conduct for APEX 1.0 organized by The Innovation League, Bhopal.",
      },
      { property: "og:title", content: "Rules & Regulations — APEX 1.0" },
      {
        property: "og:description",
        content: "Complete 14-section official rules protocol for APEX 1.0 National Hackathon.",
      },
      { property: "og:url", content: "/rules" },
    ],
    links: [{ rel: "canonical", href: "/rules" }],
  }),
  component: RulesPage,
});

const RULES_SECTIONS = [
  {
    icon: BookOpen,
    code: "RULE_01",
    title: "1. Event Overview",
    points: [
      "APEX 1.0 is an open-innovation national student hackathon organized by The Innovation League, Bhopal.",
      "The event is conducted across two structured rounds: Round 1 (Online Submission Round) and Round 2 (Offline Grand Finale in Bhopal).",
      "Official website: https://apexhack.online. All official announcements, updates, and results will be published on the official domain.",
    ],
  },
  {
    icon: Calendar,
    code: "RULE_02",
    title: "2. Important Dates",
    points: [
      "Online Submission Round: 25 November 2026 (Submissions close at 23:59 IST).",
      "Shortlisted Teams Announcement: 30 November 2026 via official website and registered email.",
      "Grand Finale: 10 December 2026 at the designated venue in Bhopal, Madhya Pradesh.",
      "Exact finale venue will be communicated directly to shortlisted teams.",
    ],
  },
  {
    icon: Users,
    code: "RULE_03",
    title: "3. Team Formation",
    points: [
      "Teams must consist of 1 to 4 members (Single-member teams and multi-member teams up to 4 are permitted).",
      "Every team must designate exactly one Team Leader responsible for official communications, submission, and payment.",
      "A participant cannot belong to multiple teams in APEX 1.0. Duplicate memberships across teams will lead to disqualification.",
      "Members may belong to different colleges, institutions, academic years, or departments.",
    ],
  },
  {
    icon: FileText,
    code: "RULE_04",
    title: "4. Registration",
    points: [
      "Registration must be completed through https://apexhack.online/register.",
      "The registration fee is fixed at ₹199 per team for Round 1.",
      "Registration is complete and valid ONLY after successful online payment via Razorpay and submission of required team and project details.",
      "Each team receives an official sequential Player ID (e.g., APEX-1001) upon confirmed payment.",
    ],
  },
  {
    icon: FileCode,
    code: "RULE_05",
    title: "5. Submission Guidelines",
    points: [
      "Accepted file formats for project presentations are PPT (.ppt, .pptx) and PDF (.pdf).",
      "Maximum allowed file size is 20 MB. Files are stored securely in encrypted cloud storage.",
      "Submissions must clearly articulate: Problem Statement, Proposed Solution, Technology Stack, Technical Architecture, and Expected Potential Impact.",
      "Submitted ideas and presentations must be original work created by the team members.",
    ],
  },
  {
    icon: Cpu,
    code: "RULE_06",
    title: "6. Technology and Tools",
    points: [
      "Participants are free to choose any programming languages, frameworks, open-source libraries, cloud platforms, or hardware.",
      "AI programming tools and LLM assistants are allowed, provided the team thoroughly understands, explains, and defends their code.",
      "Pre-existing libraries, APIs, and boilerplate templates must be disclosed in the technology stack section.",
    ],
  },
  {
    icon: Sparkles,
    code: "RULE_07",
    title: "7. Evaluation Criteria",
    points: [
      "Innovation and Originality: Freshness and creativity in tackling meaningful problems.",
      "Problem Understanding: Depth of understanding of the domain and root user pain points.",
      "Technical Implementation: Architecture quality, code robustness, and functional depth.",
      "Practical Feasibility & Scalability: Viability of implementation and real-world deployment potential.",
      "User Experience & Design: Intuitive workflow, aesthetics, and accessibility.",
      "Presentation & Demonstration: Pitch clarity, storytelling, communication, and live demo quality.",
    ],
  },
  {
    icon: MapPin,
    code: "RULE_08",
    title: "8. Finale Participation",
    points: [
      "Physical participation in Bhopal on 10 December 2026 is expected for all shortlisted teams.",
      "Teams are responsible for their travel arrangements to Bhopal. Organizers provide high-speed Wi-Fi, power, mentors, and designated hack zones.",
      "Online presentation may be requested with prior organizer approval under exceptional circumstances. It is not automatically guaranteed.",
    ],
  },
  {
    icon: Shield,
    code: "RULE_09",
    title: "9. Code of Conduct",
    points: [
      "APEX 1.0 is dedicated to providing a safe, respectful, inclusive, and harassment-free environment for all participants.",
      "Zero tolerance for harassment, discrimination, foul language, sabotage, or misconduct.",
      "Violations will result in immediate disqualification and removal from the event without refund.",
    ],
  },
  {
    icon: Scale,
    code: "RULE_10",
    title: "10. Intellectual Property",
    points: [
      "Participants retain 100% intellectual property (IP) ownership of all code, designs, pitch decks, and prototypes created.",
      "The Innovation League does not claim ownership over any participant projects.",
      "By participating, teams grant organizers non-exclusive permission to display project summaries, photos, and team names for promotional purposes.",
    ],
  },
  {
    icon: Trophy,
    code: "RULE_11",
    title: "11. Prizes & Rewards",
    points: [
      "Total Cash Prize Pool: ₹30,000.",
      "First Prize (Champion): ₹15,000.",
      "Second Prize (Runner Up): ₹10,000.",
      "Third Prize (2nd Runner Up): ₹5,000.",
      "Prizes will be transferred digitally to the designated Team Leader's verified bank account after KYC / student ID verification.",
    ],
  },
  {
    icon: AlertTriangle,
    code: "RULE_12",
    title: "12. Disqualification",
    points: [
      "Plagiarism, cloning existing commercial applications without original innovation, or misrepresenting work.",
      "Providing false student enrollment details, fake contact information, or participating in multiple teams.",
      "Failure to adhere to deadlines or code of conduct violations.",
    ],
  },
  {
    icon: HelpCircle,
    code: "RULE_13",
    title: "13. Event Changes",
    points: [
      "The Innovation League reserves the right to modify dates, schedules, judging panels, or venue specifics due to unforeseen circumstances.",
      "Any material changes will be promptly notified on the official website https://apexhack.online and sent to registered emails.",
    ],
  },
  {
    icon: CheckCircle2,
    code: "RULE_14",
    title: "14. Acceptance of Rules",
    points: [
      "By registering and paying the fee for APEX 1.0, all team members irrevocably agree to abide by these official Rules & Regulations.",
      "The decisions of the organizers and judging panel are final, conclusive, and binding on all participants.",
    ],
  },
];

function RulesPage() {
  return (
    <>
      <PageHeader
        code="SYSTEM 04 / PROTOCOL"
        title="Rules & Regulations"
        subtitle="Official guidelines, protocols, and evaluation criteria for all APEX 1.0 participants. Organizers: The Innovation League, Bhopal."
      />

      {/* 14 Sections of Official Rules */}
      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {RULES_SECTIONS.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.code}
                  className="glass-panel relative flex flex-col justify-between rounded-xl border border-border/50 p-6 sm:p-7 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
                          {rule.title}
                        </h2>
                      </div>
                      <SystemLabel className="text-primary text-[0.65rem]">{rule.code}</SystemLabel>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {rule.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{pt}</span>
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

      {/* Judging Criteria Weightage Breakdown */}
      <Section className="pb-16 sm:pb-24">
        <Reveal>
          <SectionHeading code="PROTOCOL / SCORING" title="How Judging Works" />

          {/* Mobile scoring list */}
          <div className="mt-6 divide-y divide-border/25 border-y border-border/25 sm:hidden">
            {EVALUATION_CRITERIA.map((j) => (
              <div key={j.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">{j.name}</span>
                  <p className="text-[0.7rem] text-muted-foreground">{j.subtitle}</p>
                </div>
                <span className={cn("font-display text-lg font-black", j.colorClass)}>{j.weightage}</span>
              </div>
            ))}
          </div>

          {/* Desktop: Grid Cards */}
          <div className="mt-8 hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EVALUATION_CRITERIA.map((j, i) => (
              <div key={j.id} className={cn("glass-panel relative overflow-hidden rounded-xl p-6", j.borderClass)}>
                <span
                  className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[7rem] font-black leading-none text-foreground/[0.03]"
                  aria-hidden
                >
                  {j.id}
                </span>
                <div className="relative">
                  <p className={cn("font-display text-3xl font-black", j.colorClass)}>{j.weightage}</p>
                  <p className="mt-2 system-label">{j.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{j.subtitle}</p>
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border/40">
                    <motion.div
                      className={cn("h-full rounded-full", j.bgClass.replace("/10", "/60"))}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${j.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border/40 bg-card/30 p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Official Note:</strong> Projects are evaluated across 7 primary dimensions: Innovation and originality, Problem understanding, Technical implementation, Practical feasibility, User experience and design, Impact and scalability, and Presentation and demonstration. Ensure submissions strictly meet originality guidelines.
          </div>
        </Reveal>
      </Section>
    </>
  );
}
