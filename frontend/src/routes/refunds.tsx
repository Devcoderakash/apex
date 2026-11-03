import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, HelpCircle, Mail, RotateCcw, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — APEX 1.0" },
      {
        name: "description",
        content:
          "Official Refund and Cancellation Policy for APEX 1.0 National Hackathon organized by The Innovation League, Bhopal.",
      },
      { property: "og:title", content: "Refund Policy — APEX 1.0" },
      { property: "og:url", content: "/refunds" },
    ],
    links: [{ rel: "canonical", href: "/refunds" }],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <>
      <PageHeader
        code="SYSTEM_17 / REFUNDS"
        title="Refund & Cancellation Policy"
        subtitle="Official policy regarding event fee cancellation, payment disputes, and duplicate transaction handling. Organizer: The Innovation League, Bhopal."
      />

      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Core Policy Highlight Card */}
            <div className="rounded-xl border border-primary/40 bg-card/60 p-6 sm:p-8 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <SystemLabel className="text-primary text-xs">OFFICIAL STIPULATION</SystemLabel>
                  <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-foreground">
                    General Non-Refundability
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The Round 1 registration fee of <strong>₹199 per team</strong> is <strong>strictly non-refundable</strong> once payment has been verified and an official Player ID (<code className="text-primary font-mono">APEX-XXXX</code>) has been issued. Operational screening slots, evaluation bandwidth, and cloud server storage are immediately committed upon payment confirmation.
              </p>
            </div>

            {/* Refund Exceptions: Duplicate Debits */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border/50 bg-card/40 p-6">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-display text-base font-bold uppercase text-foreground">Duplicate Payment Debits</h3>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  If an account was debited more than once for the same registration order due to a network or banking gateway timeout, the duplicate charge will be fully refunded to the original payment source after verification.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/40 p-6">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base font-bold uppercase text-foreground">Dispute Claim Window</h3>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Dispute or duplicate payment refund claims must be raised within <strong>7 days</strong> of the transaction date. Claims must include the Razorpay Payment ID, bank statement snippet, and registered email address.
                </p>
              </div>
            </div>

            {/* Step-by-Step Refund Process */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold uppercase text-foreground mb-4">Refund Claim Procedure</h3>
              <ol className="list-decimal list-inside space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <li><strong>Initiate Request:</strong> Submit your dispute through our <Link to="/grievance" className="text-primary underline">Grievance Portal</Link> or email <code className="text-foreground font-mono">support@apexhack.online</code> with the subject <em>"Payment Dispute — [Your Team Name]"</em>.</li>
                <li><strong>Provide Evidence:</strong> Attach proof of multiple debits (bank statement / UPI UTR reference) and the Razorpay Payment IDs.</li>
                <li><strong>Audit & Verification:</strong> Our financial team reconciles the transactions with Razorpay merchant logs within 48 to 72 business hours.</li>
                <li><strong>Disbursal:</strong> Approved refunds are credited back to the original bank account or UPI VPA within 5 to 7 banking days pursuant to RBI payment aggregator guidelines.</li>
              </ol>
            </div>

            {/* Event Cancellation Stance */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <h3 className="font-display text-base font-bold uppercase text-foreground mb-2">Event Postponement or Cancellation</h3>
              <p>
                In the highly improbable event that APEX 1.0 is cancelled outright by the organizers without rescheduling, 100% of the registration fee will be refunded to all verified registered teams. In case of date rescheduling, registrations remain valid for the updated schedule.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
