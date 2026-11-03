import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, Lock, Send, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitPrivacyRequest } from "@/lib/api";

export const Route = createFileRoute("/privacy-requests")({
  head: () => ({
    meta: [
      { title: "Data Principal Rights Portal (DPDP Act, 2023) — APEX 1.0" },
      {
        name: "description",
        content:
          "Exercise your statutory rights to personal data access, correction, and erasure under the Digital Personal Data Protection Act, 2023.",
      },
      { property: "og:title", content: "Privacy Requests — APEX 1.0" },
      { property: "og:url", content: "/privacy-requests" },
    ],
    links: [{ rel: "canonical", href: "/privacy-requests" }],
  }),
  component: PrivacyRequestsPage,
});

function PrivacyRequestsPage() {
  const [requestType, setRequestType] = useState("access");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !details.trim()) {
      toast.error("Please fill in Name, Email, and Request Details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPrivacyRequest({
        request_type: requestType,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        player_id: playerId.trim() || undefined,
        request_details: details.trim(),
      });

      setRequestId(res.requestId || `PRV-${Math.floor(1000 + Math.random() * 9000)}`);
      toast.success("PRIVACY REQUEST LOGGED", {
        description: `Your Request ID is ${res.requestId}. Our compliance desk will process your request.`,
      });
    } catch (err: any) {
      toast.error("Failed to submit privacy request", {
        description: err.message || "Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        code="SYSTEM_16 / DATA RIGHTS"
        title="Data Principal Rights & Privacy Requests"
        subtitle="Exercise your statutory rights under the Digital Personal Data Protection Act, 2023 (Access, Correction, Erasure & Nomination)."
      />

      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Rights Explanations */}
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/30 bg-card/60 p-6 sm:p-7 backdrop-blur-md">
                <SystemLabel className="text-primary text-[0.65rem]">STATUTORY PRIVACY FRAMEWORK</SystemLabel>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-foreground mt-1">
                  Your Rights as a Data Principal
                </h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Under the Digital Personal Data Protection Act (DPDP Act), 2023, you have guaranteed statutory rights over the personal data processed by The Innovation League:
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary shrink-0" />
                      <strong className="text-xs sm:text-sm font-bold text-foreground">1. Right to Access Information (Section 11)</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Request a summary of personal data being processed, processing activities, and identities of all third-party processors (e.g. Supabase, Razorpay).
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <strong className="text-xs sm:text-sm font-bold text-foreground">2. Right to Correction and Updating (Section 12)</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Correct misleading, inaccurate, or outdated personal information, teammate email addresses, or college affiliations.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-primary shrink-0" />
                      <strong className="text-xs sm:text-sm font-bold text-foreground">3. Right to Erasure / Deletion (Section 12)</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Request deletion of personal data and uploaded pitch decks, subject to statutory tax/financial record retention rules.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/40 p-5 text-xs text-muted-foreground leading-relaxed">
                <ShieldAlert className="h-4 w-4 text-primary inline mr-1.5" />
                <strong>Identity Verification:</strong> To prevent unauthorized deletion or access to another team's data, our compliance officer may verify your registered email before fulfilling erasure requests.
              </div>
            </div>

            {/* Right: Submission Form */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-6 sm:p-8 backdrop-blur-md">
              <SystemLabel className="text-primary text-xs">ONLINE REQUEST</SystemLabel>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-foreground mt-1">
                Submit Privacy Request
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your request will be assigned a tracking ID and reviewed by our compliance officer.
              </p>

              {requestId ? (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <h3 className="font-display text-lg font-bold text-foreground mt-3 uppercase">REQUEST REGISTERED</h3>
                  <p className="font-mono text-sm text-emerald-400 font-bold mt-1">Tracking ID: {requestId}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    We have logged your request. You will receive email verification and processing updates at your registered address within statutory timelines.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRequestId(null);
                      setDetails("");
                    }}
                    className="mt-4 font-mono text-xs"
                  >
                    SUBMIT ANOTHER REQUEST
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                  <div>
                    <Label htmlFor="pr_type" className="text-xs font-mono uppercase text-muted-foreground">Request Type *</Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger id="pr_type" className="mt-1">
                        <SelectValue placeholder="Select Request Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access">Data Access (Download my data summary)</SelectItem>
                        <SelectItem value="correction">Data Correction (Update personal details)</SelectItem>
                        <SelectItem value="erasure">Data Erasure (Delete my personal information)</SelectItem>
                        <SelectItem value="nomination">Nomination (Designate legal representative)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pr_name" className="text-xs font-mono uppercase text-muted-foreground">Full Name *</Label>
                    <Input
                      id="pr_name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Akash Lodhi"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pr_email" className="text-xs font-mono uppercase text-muted-foreground">Registered Email *</Label>
                      <Input
                        id="pr_email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. leader@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pr_phone" className="text-xs font-mono uppercase text-muted-foreground">Mobile Number</Label>
                      <Input
                        id="pr_phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pr_pid" className="text-xs font-mono uppercase text-muted-foreground">Team / Player ID (Optional)</Label>
                    <Input
                      id="pr_pid"
                      type="text"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      placeholder="e.g. APEX-1001"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pr_details" className="text-xs font-mono uppercase text-muted-foreground">Request Details & Specific Instructions *</Label>
                    <Textarea
                      id="pr_details"
                      required
                      rows={4}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Specify exactly what data you wish to access, correct, or erase (e.g., delete presentation file, update teammate email, export full registration log)..."
                      className="mt-1 text-xs sm:text-sm"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full font-mono text-xs tracking-wider">
                    {submitting ? "LOGGING PRIVACY REQUEST..." : "SUBMIT STATUTORY PRIVACY REQUEST →"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

