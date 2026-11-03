import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, Mail, Phone, Send, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitGrievance } from "@/lib/api";

export const Route = createFileRoute("/grievance")({
  head: () => ({
    meta: [
      { title: "Grievance Redressal & DPDP Officer — APEX 1.0" },
      {
        name: "description",
        content:
          "Official Grievance Redressal mechanism and Data Protection Officer contact for APEX 1.0 National Hackathon in accordance with the DPDP Act, 2023.",
      },
      { property: "og:title", content: "Grievance Redressal — APEX 1.0" },
      { property: "og:url", content: "/grievance" },
    ],
    links: [{ rel: "canonical", href: "/grievance" }],
  }),
  component: GrievancePage,
});

function GrievancePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [category, setCategory] = useState("data_privacy");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !description.trim()) {
      toast.error("Please fill in all required fields (Name, Email, Description).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitGrievance({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        player_id: playerId.trim() || undefined,
        category,
        description: description.trim(),
      });

      setSubmittedId(res.complaintId || `GRV-${Math.floor(1000 + Math.random() * 9000)}`);
      toast.success("GRIEVANCE SUBMITTED SUCCESSFULLY", {
        description: `Your Complaint ID is ${res.complaintId}. An acknowledgement has been logged.`,
      });
    } catch (err: any) {
      toast.error("Failed to submit grievance", {
        description: err.message || "Please check your network and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        code="SYSTEM_15 / GRIEVANCE"
        title="Grievance Redressal & Privacy Contact"
        subtitle="Official statutory grievance portal and Data Protection Officer information for APEX 1.0 pursuant to the DPDP Act, 2023."
      />

      <Section className="py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Grievance Officer & Statutory Details */}
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/30 bg-card/60 p-6 sm:p-7 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <SystemLabel className="text-primary text-[0.65rem]">DPDP ACT, 2023 / SECTION 13</SystemLabel>
                    <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-foreground">
                      Designated Grievance Officer
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Officer:</strong> [Designated Grievance Officer Placeholder, The Innovation League]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Email:</strong> grievance@apexhack.online / support@apexhack.online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Support Contact:</strong> +91 98765 43210 (Mon–Fri, 10:00 AM – 6:00 PM IST)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Response Timelines:</strong> Initial acknowledgement within 48 hours; full resolution within 30 days.</span>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-border/40 bg-background/50 p-4 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Appellate Rights:</strong> If your grievance is not resolved within the prescribed period, or if you are dissatisfied with the resolution, you have the statutory right to escalate the matter to the <strong>Data Protection Board of India</strong> in accordance with Section 13(4) of the Digital Personal Data Protection Act, 2023.
                </div>
              </div>

              {/* Redressal Workflow Guide */}
              <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <h3 className="font-display text-base font-bold uppercase text-foreground mb-3">Redressal Process</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Submit Complaint:</strong> Fill the grievance form with complete factual details.</li>
                  <li><strong>Acknowledgement:</strong> A unique Complaint ID (<code className="text-primary font-mono">GRV-XXXX</code>) is generated.</li>
                  <li><strong>Investigation:</strong> The Grievance Officer examines audit logs and database records.</li>
                  <li><strong>Resolution:</strong> Formal response and corrective actions are communicated via registered email.</li>
                </ol>
              </div>
            </div>

            {/* Right: Grievance Submission Form */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-6 sm:p-8 backdrop-blur-md">
              <SystemLabel className="text-primary text-xs">OFFICIAL FORM</SystemLabel>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-foreground mt-1">
                Submit a Grievance
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                All submissions are encrypted and handled confidentially by our compliance desk.
              </p>

              {submittedId ? (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <h3 className="font-display text-lg font-bold text-foreground mt-3 uppercase">GRIEVANCE LOGGED</h3>
                  <p className="font-mono text-sm text-emerald-400 font-bold mt-1">Complaint ID: {submittedId}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Your complaint has been registered. Our Grievance Officer will review your submission and respond within the statutory response window.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmittedId(null);
                      setDescription("");
                    }}
                    className="mt-4 font-mono text-xs"
                  >
                    SUBMIT ANOTHER GRIEVANCE
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                  <div>
                    <Label htmlFor="g_name" className="text-xs font-mono uppercase text-muted-foreground">Full Name *</Label>
                    <Input
                      id="g_name"
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
                      <Label htmlFor="g_email" className="text-xs font-mono uppercase text-muted-foreground">Email Address *</Label>
                      <Input
                        id="g_email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. participant@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="g_phone" className="text-xs font-mono uppercase text-muted-foreground">Mobile Number</Label>
                      <Input
                        id="g_phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="g_pid" className="text-xs font-mono uppercase text-muted-foreground">Team / Player ID (Optional)</Label>
                      <Input
                        id="g_pid"
                        type="text"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        placeholder="e.g. APEX-1001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="g_cat" className="text-xs font-mono uppercase text-muted-foreground">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="g_cat" className="mt-1">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="data_privacy">Data Privacy & Consent</SelectItem>
                          <SelectItem value="data_correction">Data Correction / Update</SelectItem>
                          <SelectItem value="data_erasure">Data Erasure Request</SelectItem>
                          <SelectItem value="payment_fee">Payment & Fee Dispute</SelectItem>
                          <SelectItem value="event_conduct">Event Protocol / Conduct</SelectItem>
                          <SelectItem value="other">Other General Complaint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="g_desc" className="text-xs font-mono uppercase text-muted-foreground">Grievance Description *</Label>
                    <Textarea
                      id="g_desc"
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please explain the nature of your complaint, relevant dates, transaction IDs, or specific personal data involved..."
                      className="mt-1 text-xs sm:text-sm"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full font-mono text-xs tracking-wider">
                    {submitting ? "SUBMITTING GRIEVANCE..." : "SUBMIT FORMAL GRIEVANCE →"}
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

