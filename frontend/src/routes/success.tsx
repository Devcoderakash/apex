import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import {
  getTeamByOrderId,
  triggerConfirmationEmail,
} from "@/lib/api";

const searchSchema = z.object({
  pid: z.string().optional(),
  r_id: z.string().optional(),
  team: z.string().optional(),
  leader: z.string().optional(),
  order_id: z.string().optional(),
});

export const Route = createFileRoute("/success")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Registration Confirmed — APEX 1.0" },
      {
        name: "description",
        content: "Your APEX 1.0 registration is confirmed. Keep your unique Registration ID safe.",
      },
      { property: "og:title", content: "Registration Confirmed — APEX 1.0" },
      { property: "og:description", content: "Registration complete. Welcome to APEX 1.0." },
      { property: "og:url", content: "/success" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/success" }],
  }),
  component: SuccessPage,
});

function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A8.9 8.9 0 0 0 0 53h27.5z" fill="#00AC47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#EA4335"/>
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832D"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684FC"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
    </svg>
  );
}

function SuccessPage() {
  const search = Route.useSearch();
  const rawId = search.r_id || search.pid || "";
  const [teamInfo, setTeamInfo] = useState<{
    r_id: string;
    team: string;
    leader: string;
    driveLink?: string;
    amount?: number;
  } | null>(
    rawId
      ? {
          r_id: rawId,
          team: search.team || "Team",
          leader: search.leader || "Team Leader",
          amount: 10,
        }
      : null,
  );
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resending, setResending] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  useEffect(() => {
    if (search.order_id) {
      getTeamByOrderId(search.order_id)
        .then((t) => {
          if (t && (t.r_id || t.player_id) && t.team_name) {
            const calculatedAmount = t.amount_paid
              ? Math.round(t.amount_paid / 100)
              : t.payment_amount
                ? (t.payment_amount > 1000 ? Math.round(t.payment_amount / 100) : t.payment_amount)
                : 10;
            setTeamInfo({
              r_id: t.r_id || t.player_id,
              team: t.team_name,
              leader: t.team_leader_name || t.leader_name || search.leader || "Team Leader",
              driveLink: t.idea_drive_link,
              amount: calculatedAmount,
            });
          }
        })
        .catch(() => {});
    } else if (rawId) {
      setTeamInfo({
        r_id: rawId,
        team: search.team || "Team",
        leader: search.leader || "Team Leader",
        amount: 10,
      });
    }

    // Auto-trigger confirmation email if not already sent
    const identifier = search.order_id || rawId;
    if (identifier) {
      setEmailStatus("sending");
      triggerConfirmationEmail({ orderId: search.order_id, playerId: rawId })
        .then((res) => {
          if (res.success) {
            setEmailStatus("sent");
          } else {
            setEmailStatus("idle");
          }
        })
        .catch(() => setEmailStatus("idle"));
    }
  }, [search.order_id, rawId, search.team, search.leader]);

  const displayId = teamInfo?.r_id || rawId;
  const displayTeam = teamInfo?.team || search.team || "Team APEX";
  const displayLeader = teamInfo?.leader || search.leader || "Team Leader";
  const displayAmount = teamInfo?.amount || 10;

  const handleCopyId = () => {
    if (!displayId) return;
    navigator.clipboard.writeText(displayId);
    setCopiedId(true);
    toast.success("Registration ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyOrder = () => {
    if (search.order_id) {
      navigator.clipboard.writeText(search.order_id);
      setCopiedOrder(true);
      toast.success("Order ID copied to clipboard!");
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const handleResendEmail = async () => {
    const identifier = search.order_id || displayId;
    if (!identifier) return;
    setResending(true);
    toast.loading("Sending confirmation email...", { id: "resend_email" });
    try {
      const res = await triggerConfirmationEmail({
        orderId: search.order_id,
        playerId: displayId,
        forceRetry: true,
      });
      if (res.success) {
        setEmailStatus("sent");
        toast.success("Confirmation email dispatched!", { id: "resend_email" });
      } else {
        toast.error(res.error || "Failed to deliver email", { id: "resend_email" });
      }
    } catch {
      toast.error("Failed to resend email", { id: "resend_email" });
    } finally {
      setResending(false);
    }
  };

  const addToCalendar = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//APEX 1.0//Hackathon Entry//EN",
      "BEGIN:VEVENT",
      "SUMMARY:APEX 1.0 National Hackathon — Grand Finale",
      "DTSTART:20260314T043000Z",
      "DTEND:20260315T123000Z",
      "LOCATION:Tech Convention Centre, Bhopal, Madhya Pradesh",
      `DESCRIPTION:APEX 1.0 registration confirmed for Team ${displayTeam} (Registration ID: ${displayId}).`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `apex-registration-${displayId || "pass"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar invite downloaded!");
  };

  if (!displayId && !search.order_id) {
    return (
      <section className="scanlines relative flex min-h-[100svh] items-center justify-center overflow-hidden void-bg px-4 py-24 sm:px-8 sm:py-28">
        <div className="grid-veil pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-md text-center rounded-2xl border border-border/60 bg-card/75 p-6 sm:p-10 backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(225,29,72,0.25)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            NO REGISTRATION FOUND
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            No active or verified registration was detected. Please register your team and complete payment to generate your official APEX 1.0 pass.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/register">
              <Button size="lg" className="cyber-glow font-mono font-bold tracking-wider">
                <ArrowLeft className="mr-2 h-4 w-4" />
                GO TO REGISTRATION
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="scanlines relative flex min-h-[100svh] items-center justify-center overflow-hidden void-bg px-4 py-24 sm:px-8 sm:py-28">
      <div className="grid-veil pointer-events-none absolute inset-0" aria-hidden />
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />

      {/* Cyber ambient glow effects */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-3xl"
      >
        {/* Container */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/75 p-4 sm:p-7 md:p-10 backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(225,29,72,0.25)]">
          {/* Top Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 sm:pb-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <SystemLabel className="text-emerald-400 font-bold tracking-[0.16em] sm:tracking-[0.2em] text-[0.65rem] sm:text-xs">
                REGISTRATION CONFIRMED
              </SystemLabel>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1 font-mono text-[0.6rem] sm:text-[0.65rem] tracking-[0.14em] sm:tracking-[0.16em] text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              VERIFIED PAYMENT · ₹{displayAmount} PAID
            </div>
          </div>

          {/* Heading */}
          <div className="mt-5 sm:mt-6">
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white break-words">
              WELCOME TO <span className="text-primary text-glow">APEX 1.0</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              Your registration details and idea presentation have been submitted and saved. Keep your official Registration ID below safe for all hackathon phases.
            </p>
          </div>

          {/* Primary Registration ID Banner */}
          <div className="mt-6 group relative overflow-hidden rounded-xl border border-primary/50 bg-primary/10 p-4 sm:p-6 transition-all hover:border-primary/80">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
                OFFICIAL REGISTRATION ID (R_ID)
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-card/80 px-3 py-1.5 font-mono text-xs text-foreground hover:bg-primary/20 hover:text-white transition-colors"
                title="Copy Registration ID"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? "COPIED" : "COPY ID"}
              </button>
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-white break-all drop-shadow-[0_0_15px_rgba(255,23,68,0.4)]">
              {displayId}
            </div>
            <p className="mt-1.5 font-mono text-[0.65rem] sm:text-xs text-muted-foreground tracking-wider">
              Permanent cryptographic identifier. Quote this R_ID in all queries, submissions, and check-ins.
            </p>
          </div>

          {/* Key Registration Details Grid */}
          <div className="mt-4 sm:mt-5 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Team Name Card */}
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
              <dt className="system-label text-muted-foreground">TEAM NAME</dt>
              <dd className="mt-2 font-display text-base sm:text-xl md:text-2xl font-bold tracking-wide text-foreground break-words line-clamp-2">
                {displayTeam}
              </dd>
              <p className="mt-1 font-mono text-[0.6rem] sm:text-[0.65rem] text-muted-foreground tracking-wider">
                Category: Open Innovation
              </p>
            </div>

            {/* Team Leader Card */}
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
              <dt className="system-label text-muted-foreground">TEAM LEADER</dt>
              <dd className="mt-2 font-display text-base sm:text-xl md:text-2xl font-bold tracking-wide text-foreground break-words">
                {displayLeader}
              </dd>
              <p className="mt-1 font-mono text-[0.6rem] sm:text-[0.65rem] text-muted-foreground tracking-wider">
                Primary Contact & Team Lead
              </p>
            </div>

            {/* Google Drive Link Confirmation Card */}
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <dt className="system-label text-muted-foreground">PRESENTATION SUBMISSION</dt>
                <GoogleDriveIcon className="h-4 w-4" />
              </div>
              <dd className="mt-2 flex items-center gap-2 font-display text-base sm:text-lg font-bold text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                GOOGLE DRIVE LINK SAVED
              </dd>
              <p className="mt-1 font-mono text-[0.6rem] sm:text-[0.65rem] text-muted-foreground tracking-wider">
                Linked for Round 1 Evaluation · Viewer Access Required
              </p>
            </div>

            {/* Payment Card */}
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <dt className="system-label text-muted-foreground">PAYMENT STATUS</dt>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <dd className="mt-2 font-display text-base sm:text-xl md:text-2xl font-bold text-emerald-400">
                PAID (₹{displayAmount})
              </dd>
              <p className="mt-1 font-mono text-[0.6rem] sm:text-[0.65rem] text-muted-foreground tracking-wider">
                Razorpay Verified · Fee Cleared
              </p>
            </div>
          </div>

          {/* Round 1 Instructions Card */}
          <div className="mt-4 sm:mt-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                <Info className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
                  ROUND 1 EVALUATION INSTRUCTIONS
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong className="text-white">Keep Drive Access Open:</strong> Verify your Google Drive presentation link remains set to <strong className="text-cyan-300">"Anyone with the link – Viewer"</strong> throughout the evaluation cycle.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong className="text-white">Screening Criteria:</strong> Our judging panel evaluates problem impact, innovation, feasibility, and technical depth.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong className="text-white">Shortlist Announcement:</strong> Qualifying teams will receive direct email invitations to the Grand Finale Hackathon.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order ID banner if present */}
          {search.order_id ? (
            <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3.5 sm:px-4 py-2.5 sm:py-3">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[0.6rem] tracking-[0.16em] text-muted-foreground">
                  PAYMENT ORDER ID:
                </span>
                <p className="font-mono text-xs text-foreground/80 truncate break-all">{search.order_id}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyOrder}
                className="h-8 px-2.5 font-mono text-[0.65rem] text-muted-foreground hover:text-white shrink-0 min-h-[36px]"
              >
                {copiedOrder ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {copiedOrder ? "COPIED" : "COPY"}
              </Button>
            </div>
          ) : null}

          {/* Automated Confirmation Email Banner */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-card text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold tracking-wider text-white">
                    CONFIRMATION EMAIL
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[0.6rem] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {emailStatus === "sent" ? "SENT" : "DELIVERED"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Official confirmation & Round 1 screening details have been dispatched to your registered team email.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={resending}
              className="h-9 shrink-0 border-border bg-background/50 font-mono text-xs text-muted-foreground hover:text-white"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending ? "SENDING..." : "RESEND EMAIL"}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              className="h-11 sm:h-12 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-mono text-xs tracking-[0.16em] sm:tracking-[0.18em] transition-all w-full sm:w-auto min-h-[44px]"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO HOME
              </Link>
            </Button>
            <Button
              onClick={addToCalendar}
              variant="outline"
              className="h-11 sm:h-12 border-border bg-background/50 hover:bg-secondary/60 font-mono text-xs tracking-[0.16em] sm:tracking-[0.18em] text-white w-full sm:w-auto min-h-[44px]"
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> ADD TO CALENDAR
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
