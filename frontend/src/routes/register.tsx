import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Link2,
  Linkedin,
  Loader2,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadRazorpayScript } from "@/lib/razorpay";
import { createOrder, verifyPaymentAndRegister } from "@/lib/api";
import { cn } from "@/lib/utils";

const GOOGLE_DRIVE_PATTERNS = [
  /^https:\/\/(?:drive|docs)\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/open\?id=[a-zA-Z0-9_-]+/i,
  /^https:\/\/(?:drive|docs)\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+/i,
  /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/i,
];

const googleDriveLinkSchema = z
  .string({ required_error: "Please provide your Google Drive presentation link." })
  .trim()
  .min(1, "Please provide your Google Drive presentation link.")
  .max(500, "Link is too long")
  .refine(
    (val) => {
      const clean = val.trim();
      return GOOGLE_DRIVE_PATTERNS.some((pattern) => pattern.test(clean));
    },
    { message: "Please enter a valid Google Drive link." },
  );

function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H1.2c0 1.55.4 3.1 1.2 4.5l4.2 9.35z" fill="#0066DA" />
      <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 52.65c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-32z" fill="#00AC47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.15c.8-1.4 1.2-2.95 1.2-4.5H59.85L53.2 65.6l-3.75 6.5 13.75 23.8c1.35-.8 2.5-1.9 3.3-3.3l7.05-15.8z" fill="#EA4335" />
      <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.85 0H34.45c-1.65 0-3.2.55-4.55 1.35l13.75 23.8z" fill="#00832D" />
      <path d="M59.85 52.65h27.5c0-1.55-.4-3.1-1.2-4.5L73.55 25.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25.15l16.2 27.5z" fill="#2684FC" />
      <path d="M43.65 25.15L27.5 52.65H59.85L43.65 25.15z" fill="#AECBFA" />
    </svg>
  );
}

const safeLinkValidator = (val?: string) => {
  if (!val || !val.trim()) return true;
  const clean = val.trim().toLowerCase();
  if (clean.startsWith("javascript:") || clean.startsWith("data:") || clean.startsWith("vbscript:")) {
    return false;
  }
  return true;
};

const safeLinkSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine(safeLinkValidator, "Invalid or unsafe link. Javascript and data URIs are prohibited.");

const schema = z
  .object({
    team_name: z.string().trim().min(2, "Team name is required").max(80),
    leader_name: z.string().trim().min(2, "Leader name is required").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
    college: z.string().trim().min(2, "College or organization is required").max(120),
    team_size: z.enum(["1", "2", "3", "4"]),
    member1: z.string().trim().max(80).optional().or(z.literal("")),
    member2: z.string().trim().max(80).optional().or(z.literal("")),
    member3: z.string().trim().max(80).optional().or(z.literal("")),
    member4: z.string().trim().max(80).optional().or(z.literal("")),
    preferred_domain: z.string().trim().max(120).optional().or(z.literal("")),
    github_url: safeLinkSchema,
    linkedin_url: safeLinkSchema,
    project_title: z.string().trim().max(150).optional().or(z.literal("")),
    project_description: z.string().trim().max(1000).optional().or(z.literal("")),
    problem_statement: z.string().trim().max(1000).optional().or(z.literal("")),
    proposed_solution: z.string().trim().max(1000).optional().or(z.literal("")),
    tech_stack: z.string().trim().max(300).optional().or(z.literal("")),
    expected_impact: z.string().trim().max(500).optional().or(z.literal("")),
    demo_url: safeLinkSchema,
    portfolio_url: safeLinkSchema,
    other_links: safeLinkSchema,
    idea_drive_link: googleDriveLinkSchema,
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the APEX 1.0 rules, terms, and privacy policy" }),
    }),
    consent_marketing_email: z.boolean().default(false),
    consent_marketing_sms: z.boolean().default(false),
    consent_marketing_whatsapp: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const size = Number(data.team_size);
    if (size >= 2 && (!data.member1 || data.member1.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member1"],
        message: "Additional member 1 is required for team size of 2 or more",
      });
    }
    if (size >= 3 && (!data.member2 || data.member2.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member2"],
        message: "Additional member 2 is required for team size of 3 or more",
      });
    }
    if (size >= 4 && (!data.member3 || data.member3.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member3"],
        message: "Additional member 3 is required for team size of 4",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — APEX 1.0" },
      {
        name: "description",
        content:
          "Register your team of 1–4 members for APEX 1.0 and submit your idea.",
      },
      { property: "og:title", content: "Register — APEX 1.0" },
      { property: "og:description", content: "Form your team. Submit your idea. Pitch to win." },
      { property: "og:url", content: "/register" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
  component: RegisterPage,
});

/* ─── static info shown in the sidebar ─── */
const CHECKLIST = [
  { icon: Users, text: "Form a team of 1 – 4 members (Leader + up to 3)" },
  { icon: FileText, text: "Provide your Google Drive presentation link (PDF/PPT)" },
  { icon: Shield, text: "Read and agree to Rules, Terms & Privacy Policy" },
  { icon: Zap, text: "Pay ₹199 entry fee per team (Round 1)" },
  { icon: Trophy, text: "Build, pitch & win from a ₹30,000 prize pool" },
  { icon: Sparkles, text: "National open-innovation hackathon format" },
];

const QUICK_FACTS = [
  { label: "FORMAT", value: "Open Innovation" },
  { label: "STRUCTURE", value: "2 Rounds (Online + Offline)" },
  { label: "TEAM SIZE", value: "1 – 4 Members" },
  { label: "PRIZE POOL", value: "₹30,000" },
  { label: "ROUND 1 FEE", value: "₹199 / team" },
  { label: "VENUE", value: "Tech Convention Centre, Bhopal" },
];

const FORM_STEPS = [
  { id: "01", label: "Team" },
  { id: "02", label: "Members" },
  { id: "03", label: "Profile" },
  { id: "04", label: "Submission" },
];

/* ─── Page ─── */
function RegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      team_name: "",
      leader_name: "",
      email: "",
      phone: "",
      college: "",
      team_size: "2",
      member1: "",
      member2: "",
      member3: "",
      member4: "",
      preferred_domain: "",
      github_url: "",
      linkedin_url: "",
      project_title: "",
      project_description: "",
      problem_statement: "",
      proposed_solution: "",
      tech_stack: "",
      expected_impact: "",
      demo_url: "",
      portfolio_url: "",
      other_links: "",
      idea_drive_link: "",
      terms: false as unknown as true,
      consent_marketing_email: false,
      consent_marketing_sms: false,
      consent_marketing_whatsapp: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);

    try {
      const members = [values.member1, values.member2, values.member3, values.member4]
        .map((m, i) => ({ full_name: (m ?? "").trim(), position: i + 1 }))
        .filter((m) => m.full_name.length > 1);

      toast.loading("Initiating registration order...", { id: "order_create" });

      // 1. Create server-side order with Razorpay (₹199). Zero pre-payment database insertions!
      const orderData = await createOrder({
        team_name: values.team_name,
        leader_name: values.leader_name,
        email: values.email,
        phone: values.phone,
        college: values.college,
        team_size: Number(values.team_size),
        idea_drive_link: values.idea_drive_link,
        ppt_url: values.idea_drive_link,
        ...(values.preferred_domain !== undefined && { preferred_domain: values.preferred_domain }),
        ...(values.github_url !== undefined && { github_url: values.github_url }),
        ...(values.linkedin_url !== undefined && { linkedin_url: values.linkedin_url }),
        ...(values.project_title !== undefined && { project_title: values.project_title }),
        ...(values.project_description !== undefined && { project_description: values.project_description }),
        ...(values.problem_statement !== undefined && { problem_statement: values.problem_statement }),
        ...(values.proposed_solution !== undefined && { proposed_solution: values.proposed_solution }),
        ...(values.tech_stack !== undefined && { tech_stack: values.tech_stack }),
        ...(values.expected_impact !== undefined && { expected_impact: values.expected_impact }),
        ...(values.demo_url !== undefined && { demo_url: values.demo_url }),
        ...(values.portfolio_url !== undefined && { portfolio_url: values.portfolio_url }),
        ...(values.other_links !== undefined && { other_links: values.other_links }),
        consent_service: true,
        consent_marketing_email: values.consent_marketing_email,
        consent_marketing_sms: values.consent_marketing_sms,
        consent_marketing_whatsapp: values.consent_marketing_whatsapp,
        members,
      });

      toast.dismiss("order_create");

      // 2. Load official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment SDK. Please check your internet connection.");
      }

      const keyId =
        orderData.keyId ||
        (orderData as any).key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "";

      if (!keyId) {
        throw new Error("Razorpay Key ID is not configured. Please check VITE_RAZORPAY_KEY_ID in your environment.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout SDK is not loaded. Please refresh the page and try again.");
      }

      toast.loading("Opening Razorpay Checkout...", { id: "rzp_checkout" });

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId as string,
        amount: orderData.amount, // In paise (₹199 = 19900)
        currency: orderData.currency || "INR",
        name: "APEX 1.0",
        description: `Round 1 Entry — Team ${values.team_name}`,
        image: "/favicon.svg",
        order_id: orderData.orderId,
        prefill: {
          name: values.leader_name,
          email: values.email,
          contact: values.phone,
        },
        notes: {
          team_name: values.team_name,
          leader_name: values.leader_name,
          email: values.email,
        },
        theme: {
          color: "#dc2626",
        },
        modal: {
          ondismiss: () => {
            toast.dismiss("rzp_checkout");
            toast.info("PAYMENT CANCELLED", {
              description: "You closed the payment window. You can retry anytime.",
            });
            setSubmitting(false);
          },
          escape: true,
          backdropclose: false,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          toast.dismiss("rzp_checkout");
          toast.loading("Verifying payment and confirming registration...", { id: "payment_verify" });

          try {
            const verifyRes = await verifyPaymentAndRegister({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              team_name: values.team_name,
              leader_name: values.leader_name,
              email: values.email,
              phone: values.phone,
              college: values.college,
              team_size: Number(values.team_size),
              idea_drive_link: values.idea_drive_link,
              ppt_url: values.idea_drive_link,
              preferred_domain: values.preferred_domain,
              github_url: values.github_url,
              linkedin_url: values.linkedin_url,
              project_title: values.project_title,
              project_description: values.project_description,
              problem_statement: values.problem_statement,
              proposed_solution: values.proposed_solution,
              tech_stack: values.tech_stack,
              expected_impact: values.expected_impact,
              demo_url: values.demo_url,
              portfolio_url: values.portfolio_url,
              other_links: values.other_links,
              consent_marketing_email: values.consent_marketing_email,
              consent_marketing_sms: values.consent_marketing_sms,
              consent_marketing_whatsapp: values.consent_marketing_whatsapp,
              members,
            });

            if (verifyRes.success) {
              toast.success("PAYMENT & REGISTRATION CONFIRMED", {
                id: "payment_verify",
                description: `Team ID ${verifyRes.playerId} confirmed!`,
              });

              navigate({
                to: "/success",
                search: {
                  pid: verifyRes.playerId,
                  r_id: verifyRes.r_id || verifyRes.playerId,
                  team: values.team_name,
                  leader: values.leader_name,
                  order_id: response.razorpay_order_id,
                },
              });
            } else {
              toast.error("PAYMENT VERIFICATION FAILED", {
                id: "payment_verify",
                description: "Signature verification failed. Please contact support.",
              });
              setSubmitting(false);
            }
          } catch (verifyErr: any) {
            console.error("[Verify Error]", verifyErr);
            toast.error("VERIFICATION FAILED", {
              id: "payment_verify",
              description: verifyErr.message || "Failed to confirm payment with backend.",
            });
            setSubmitting(false);
          }
        },
      };

      toast.dismiss("rzp_checkout");
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on("payment.failed", (failResponse: any) => {
        console.error("[Razorpay Payment Failed]", failResponse?.error);
        toast.error("PAYMENT FAILED", {
          description: failResponse?.error?.description || "Payment was rejected. You can retry with another method.",
        });
        setSubmitting(false);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("[Registration error]", err);

      const rawMessage: string = err?.message || err?.data?.message || String(err ?? "");
      let friendlyMessage: string;

      if (rawMessage.toLowerCase().includes("already registered with a confirmed payment")) {
        friendlyMessage = "This email is already registered and paid. Please check your inbox or access pass.";
      } else if (rawMessage.toLowerCase().includes("duplicate") || rawMessage.toLowerCase().includes("unique")) {
        friendlyMessage = "A team with these credentials already exists.";
      } else {
        friendlyMessage = rawMessage || "Submission failed. Please check your details and try again.";
      }

      toast.error("REGISTRATION FAILED", { description: friendlyMessage });
      setSubmitting(false);
    }
  };

  const size = Number(form.watch("team_size"));
  const terms = form.watch("terms");

  return (
    <>
      <PageHeader
        code="SYSTEM_12 / ENTRY"
        title="Register your team"
        subtitle="Form your 1–4 member team and submit your Google Drive presentation link. ₹199 entry fee applies for Round 1."
      />

      <Section className="pt-4 pb-14 sm:py-20 md:py-28 px-3 sm:px-8 max-w-full overflow-hidden">
        <Reveal className="w-full min-w-0 max-w-full">
          {/* ── two-column layout: form on top on mobile (order-1), instructions below (order-2) ── */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-10 w-full min-w-0 max-w-full">

            {/* ── INSTRUCTIONS SIDEBAR: on mobile placed below form (order-2); on desktop left column (lg:order-1) ── */}
            <aside className="order-2 lg:order-1 flex flex-col gap-4 sm:gap-6 mt-4 lg:mt-0 w-full min-w-0 max-w-full">

              {/* Mobile divider heading */}
              <div className="lg:hidden flex items-center gap-3 pt-2">
                <SystemLabel className="text-primary text-[0.65rem] sm:text-xs shrink-0">
                  INSTRUCTIONS & EVENT PROTOCOLS
                </SystemLabel>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {/* Registrations open badge */}
              <div className="glass-panel rounded-xl p-4 sm:p-5 border border-primary/30">
                <div className="mb-2.5 sm:mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <SystemLabel className="text-primary">REGISTRATIONS: OPEN</SystemLabel>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Secure your spot at APEX 1.0 — the premier open-innovation hackathon.
                  Registrations are live and slots are limited.
                </p>
              </div>

              {/* Quick facts grid */}
              <div className="glass-panel rounded-xl p-4 sm:p-5">
                <SystemLabel className="mb-3 sm:mb-4 text-primary">EVENT DETAILS</SystemLabel>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {QUICK_FACTS.map((f) => (
                    <div key={f.label} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 sm:p-3 min-w-0">
                      <p className="font-mono text-[0.55rem] sm:text-[0.6rem] tracking-[0.15em] text-muted-foreground truncate">
                        {f.label}
                      </p>
                      <p className="mt-1 font-mono text-[0.7rem] sm:text-xs font-semibold text-foreground truncate">
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="glass-panel rounded-xl p-4 sm:p-5">
                <SystemLabel className="mb-3 sm:mb-4 text-primary">BEFORE YOU REGISTER</SystemLabel>
                <ul className="space-y-2.5 sm:space-y-3">
                  {CHECKLIST.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5 sm:gap-3">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary" />
                      <span className="text-xs sm:text-sm text-muted-foreground break-words">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social links reminder */}
              <div className="glass-panel rounded-xl p-4 sm:p-5">
                <SystemLabel className="mb-2.5 sm:mb-3 text-primary">OPTIONAL BUT RECOMMENDED</SystemLabel>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                    <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 shrink-0" />
                    <span className="truncate">Add your GitHub to showcase prior work</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                    <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 shrink-0" />
                    <span className="truncate">Add LinkedIn for post-event networking</span>
                  </div>
                </div>
              </div>

              {/* Fee callout */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-mono text-xs font-semibold tracking-widest text-amber-400">
                      ENTRY FEE — ₹199
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-words">
                      Instant online payment via Razorpay upon clicking register. Your team ID
                      and entry are verified immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Policies Links */}
              <div className="glass-panel rounded-xl p-4 sm:p-5 border-border/80">
                <SystemLabel className="mb-2.5 sm:mb-3 text-primary">OFFICIAL PROTOCOLS</SystemLabel>
                <div className="flex flex-col gap-1.5 sm:gap-2 font-mono text-xs text-muted-foreground">
                  <a
                    href="/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-primary transition-colors py-1 border-b border-border/40 min-w-0"
                  >
                    <span className="truncate">Hackathon Rules & Scoring</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-primary transition-colors py-1 border-b border-border/40 min-w-0"
                  >
                    <span className="truncate">Terms & Conditions</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-primary transition-colors py-1 min-w-0"
                  >
                    <span className="truncate">Privacy Policy</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </aside>

            {/* ── REGISTRATION FORM: on mobile placed at the TOP (order-1); on desktop right column (lg:order-2) ── */}
            <div className="order-1 lg:order-2 w-full min-w-0 max-w-full">
              {/* Steps indicator */}
              <div className="mb-5 sm:mb-6 flex items-center justify-between w-full max-w-sm sm:max-w-md mx-auto sm:mx-0 px-1 min-w-0">
                {FORM_STEPS.map((step, i) => (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none min-w-0">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-primary/60 bg-primary/10">
                        <span className="font-mono text-[0.55rem] sm:text-[0.6rem] text-primary">{step.id}</span>
                      </div>
                      <span className="mt-1 font-mono text-[0.48rem] sm:text-[0.55rem] tracking-wider sm:tracking-widest text-muted-foreground whitespace-nowrap">
                        {step.label.toUpperCase()}
                      </span>
                    </div>
                    {i < FORM_STEPS.length - 1 && (
                      <div className="mb-3.5 sm:mb-4 mx-1 sm:mx-2 h-px flex-1 bg-border/50 min-w-1 sm:min-w-3" />
                    )}
                  </div>
                ))}
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="glass-panel grid gap-5 sm:gap-8 rounded-xl p-3 sm:p-6 md:p-8 w-full min-w-0 max-w-full overflow-hidden"
                  noValidate
                >
                  {/* SECTION 01 – TEAM */}
                  <div className="w-full min-w-0 max-w-full">
                    <div className="mb-3.5 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
                      <SystemLabel className="text-primary text-[0.65rem] sm:text-xs shrink-0">SECTION_01 / TEAM</SystemLabel>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <Field form={form} name="team_name" label="TEAM NAME" placeholder="e.g. CyberKnights" />
                      <Field form={form} name="leader_name" label="TEAM LEADER NAME" placeholder="Full Name" />
                      <Field form={form} name="email" label="EMAIL" type="email" placeholder="leader@example.com" />
                      <Field form={form} name="phone" label="PHONE" placeholder="+91 98765 43210" />
                      <Field form={form} name="college" label="COLLEGE / ORGANIZATION" placeholder="Institution name" />
                      <FormField
                        control={form.control}
                        name="team_size"
                        render={({ field }) => (
                          <FormItem className="min-w-0 w-full">
                            <FormLabel className="system-label text-[0.65rem] sm:text-xs">TEAM SIZE</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 text-sm min-w-0 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["1", "2", "3", "4"].map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s} {s === "1" ? "MEMBER (SOLO)" : "MEMBERS"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs break-words" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* SECTION 02 – MEMBERS */}
                  <div className="w-full min-w-0 max-w-full">
                    <div className="mb-3.5 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
                      <SystemLabel className="text-primary text-[0.65rem] sm:text-xs shrink-0">SECTION_02 / MEMBERS</SystemLabel>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    {size === 1 ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 sm:p-4 font-mono text-xs text-muted-foreground leading-relaxed break-words">
                        <span className="font-semibold text-primary">SOLO PARTICIPANT ·</span> The team leader specified in Section 01 is registered as the sole participant. No additional team members are required.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-wider text-muted-foreground/70 break-words">
                          TEAM LEADER IS ALREADY COUNTED · ADD REMAINING MEMBERS BELOW
                        </p>
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                          <Field form={form} name="member1" label="ADDITIONAL MEMBER 1" placeholder="Member name" />
                          {size >= 3 ? <Field form={form} name="member2" label="ADDITIONAL MEMBER 2" placeholder="Member name" /> : null}
                          {size >= 4 ? <Field form={form} name="member3" label="ADDITIONAL MEMBER 3" placeholder="Member name" /> : null}
                        </div>
                        <p className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-wider text-muted-foreground/70 break-words">
                          ↑ SLOTS ADJUST WITH TEAM SIZE · LEADER + ABOVE = TOTAL TEAM
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION 03 – PROFILE */}
                  <div className="w-full min-w-0 max-w-full">
                    <div className="mb-3.5 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
                      <SystemLabel className="text-primary text-[0.65rem] sm:text-xs shrink-0">SECTION_03 / PROFILE & LINKS</SystemLabel>
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="font-mono text-[0.55rem] sm:text-[0.6rem] tracking-widest text-muted-foreground shrink-0">
                        OPTIONAL
                      </span>
                    </div>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                      <Field form={form} name="preferred_domain" label="PREFERRED DOMAIN" placeholder="e.g. AI / Web3 / Fintech" />
                      <Field form={form} name="github_url" label="GITHUB URL" placeholder="https://github.com/..." />
                      <Field form={form} name="linkedin_url" label="LINKEDIN URL" placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>

                  {/* SECTION 04 – IDEA SUBMISSION */}
                  <div className="w-full min-w-0 max-w-full">
                    <div className="mb-3.5 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
                      <SystemLabel className="text-primary text-[0.65rem] sm:text-xs shrink-0">
                        SECTION_04 / IDEA SUBMISSION
                      </SystemLabel>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>

                    <div className="glass-panel rounded-xl border border-border/80 bg-card/40 p-3.5 sm:p-5 space-y-3.5">
                      <FormField
                        control={form.control}
                        name="idea_drive_link"
                        render={({ field }) => (
                          <FormItem className="w-full min-w-0 max-w-full">
                            <FormLabel className="font-mono text-[0.7rem] sm:text-xs tracking-wider text-muted-foreground uppercase flex items-center justify-between gap-2 w-full min-w-0">
                              <span className="flex items-center gap-2 min-w-0">
                                <GoogleDriveIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">GOOGLE DRIVE PRESENTATION LINK</span>
                                <span className="text-destructive">*</span>
                              </span>
                              <span className="flex items-center gap-1 text-[0.65rem] text-muted-foreground/70 lowercase shrink-0">
                                <ExternalLink className="h-3 w-3" />
                                <span>shareable link</span>
                              </span>
                            </FormLabel>

                            <FormControl>
                              <div className="relative mt-1.5 w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Link2 className="h-4 w-4 text-muted-foreground/60" />
                                </div>
                                <Input
                                  {...field}
                                  type="url"
                                  autoComplete="off"
                                  placeholder="https://drive.google.com/file/d/..."
                                  className={cn(
                                    "h-10 text-sm pl-9 pr-10 min-w-0 w-full transition-all focus-visible:border-[#ff1744] focus-visible:ring-[#ff1744]/30 focus-visible:shadow-[0_0_12px_rgba(255,23,68,0.25)]",
                                    GOOGLE_DRIVE_PATTERNS.some((p) => p.test((field.value || "").trim())) && "border-emerald-500/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/25",
                                    form.formState.errors.idea_drive_link && "border-destructive/60 focus-visible:border-destructive"
                                  )}
                                />
                                {GOOGLE_DRIVE_PATTERNS.some((p) => p.test((field.value || "").trim())) && (
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-in fade-in zoom-in-95 duration-200" />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage className="font-mono text-[0.7rem] break-words" />

                            <p className="text-[0.7rem] sm:text-xs text-muted-foreground leading-relaxed break-words">
                              Upload your idea presentation (PPT/PDF) to Google Drive and paste its shareable link here.
                            </p>

                            <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-1.5">
                              <div className="flex items-start gap-2 text-[0.7rem] sm:text-xs text-muted-foreground">
                                <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                <span>Accepted presentation formats: <strong className="text-foreground font-medium">PDF, PPT, PPTX</strong>.</span>
                              </div>
                              <div className="flex items-start gap-2 text-[0.7rem] sm:text-xs text-muted-foreground">
                                <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                <span>Ensure Google Drive access is set to <strong className="text-[#00E5FF] font-medium">"Anyone with the link – Viewer"</strong>.</span>
                              </div>
                              <div className="flex items-start gap-2 text-[0.7rem] sm:text-xs text-muted-foreground">
                                <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                <span>Our judging panel will use this link for Round 1 evaluation.</span>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/40" />

                  {/* Rules & Guidelines Summary Card */}
                  <div className="rounded-xl border border-primary/30 bg-card/40 p-3 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-mono text-[0.7rem] sm:text-xs font-bold tracking-wider text-foreground truncate">
                          APEX 1.0 PROTOCOL & RULES SUMMARY
                        </span>
                      </div>
                      <a
                        href="/rules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[0.65rem] text-primary hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
                      >
                        FULL GUIDELINES & SCORING <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-xs text-muted-foreground break-words">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="break-words"><strong className="text-foreground">Team Size:</strong> 1–4 members (Leader + up to 3).</span>
                      </div>
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="break-words"><strong className="text-foreground">Round 1 Online:</strong> PPT/PDF idea review. ₹199 per team.</span>
                      </div>
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="break-words"><strong className="text-foreground">Round 2 Offline:</strong> Shortlisted teams pitch in Bhopal.</span>
                      </div>
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="break-words"><strong className="text-foreground">Technology & AI:</strong> Open tools; solution must be original.</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Policies Acceptance */}
                  <div className="space-y-3 w-full min-w-0">
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <Checkbox
                        id="terms"
                        checked={terms === true}
                        onCheckedChange={(v) =>
                          form.setValue("terms", (v === true) as true, { shouldValidate: true })
                        }
                        aria-label="Accept terms and conditions"
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor="terms" className="text-xs sm:text-sm text-foreground cursor-pointer leading-relaxed break-words block font-medium">
                          I and my team members have read and agree to the{" "}
                          <a href="/rules" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                            Official Rules
                          </a>
                          ,{" "}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                            Terms & Conditions
                          </a>
                          , and{" "}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                            Privacy Policy
                          </a>
                          . <span className="text-destructive">*</span>
                        </label>
                        {form.formState.errors.terms ? (
                          <p className="mt-1 font-mono text-[0.7rem] text-destructive break-words">
                            {form.formState.errors.terms.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Decoupled Optional Marketing Consents (DPDP Act 2023) */}
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3 space-y-2.5">
                      <p className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                        OPTIONAL COMMUNICATIONS (DECOUPLED PURSUANT TO DPDP ACT 2023)
                      </p>

                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="consent_email"
                          checked={form.watch("consent_marketing_email") === true}
                          onCheckedChange={(v) => form.setValue("consent_marketing_email", v === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="consent_email" className="text-[0.75rem] text-muted-foreground cursor-pointer leading-relaxed">
                          Receive hackathon newsletters, mentorship invitations, and sponsor partner opportunities via Email.
                        </label>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="consent_sms"
                          checked={form.watch("consent_marketing_sms") === true}
                          onCheckedChange={(v) => form.setValue("consent_marketing_sms", v === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="consent_sms" className="text-[0.75rem] text-muted-foreground cursor-pointer leading-relaxed">
                          Receive critical schedule alerts and shortlisting announcements via SMS.
                        </label>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="consent_whatsapp"
                          checked={form.watch("consent_marketing_whatsapp") === true}
                          onCheckedChange={(v) => form.setValue("consent_marketing_whatsapp", v === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="consent_whatsapp" className="text-[0.75rem] text-muted-foreground cursor-pointer leading-relaxed">
                          Receive fast-track updates, community access, and mentor room links via WhatsApp.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 w-full min-w-0">
                    <p className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-wider text-muted-foreground/70 order-2 sm:order-1 text-center sm:text-left break-words">
                      ALL FIELDS MARKED ARE REQUIRED · REVIEW BEFORE SUBMITTING
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="group glow-primary font-mono text-xs sm:text-sm tracking-wider sm:tracking-[0.2em] w-full sm:w-auto min-h-[48px] sm:min-h-[44px] px-4 sm:px-8 whitespace-normal sm:whitespace-nowrap order-1 sm:order-2 transition-all duration-200"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          <span>PROCESSING…</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5 sm:gap-2 text-center">
                          <span>REGISTER & PAY ₹199</span>
                          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 shrink-0">&rarr;</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

function Field({
  form,
  name,
  label,
  type = "text",
  placeholder,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0 w-full">
          <FormLabel className="system-label text-[0.65rem] sm:text-xs truncate block">{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              type={type}
              placeholder={placeholder}
              className="h-10 text-sm min-w-0 w-full"
            />
          </FormControl>
          <FormMessage className="text-xs break-words" />
        </FormItem>
      )}
    />
  );
}
