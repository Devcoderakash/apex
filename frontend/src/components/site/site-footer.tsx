import { Link } from "@tanstack/react-router";
import { Github, Instagram, Linkedin, MessageCircle, Shield } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home", isHash: false },
  { to: "/#roadmap", label: "Roadmap", isHash: true },
  { to: "/rules", label: "Rules & Regulations", isHash: false },
  { to: "/prizes", label: "Prizes", isHash: false },
  { to: "/#sponsors", label: "Sponsors", isHash: true },
  { to: "/faq", label: "FAQ", isHash: false },
  { to: "/register", label: "Register Team", isHash: false },
] as const;

const LEGAL_LINKS = [
  { to: "/rules", label: "Rules Protocol" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy (DPDP)" },
  { to: "/cookies", label: "Cookie Policy & Preferences" },
  { to: "/grievance", label: "Grievance Redressal" },
  { to: "/privacy-requests", label: "Privacy Requests (Access/Erasure)" },
  { to: "/refunds", label: "Refund & Cancellation" },
] as const;

const SOCIALS = [
  { label: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
  { label: "GitHub", icon: Github, href: "https://github.com" },
  { label: "Discord", icon: MessageCircle, href: "https://discord.com" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background/95 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:px-8 sm:pt-14 sm:pb-12 overflow-hidden">
      <div className="hair-line absolute top-0 inset-x-0" />
      <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 md:grid-cols-[1.3fr_1fr_1.2fr]">
        {/* Brand Block */}
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon-32x32.png"
              alt="APEX Logo"
              className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
            />
            <p className="font-display text-lg font-black tracking-widest text-foreground">
              APEX<span className="text-primary">//</span>1.0
            </p>
          </div>
          <p className="mt-2.5 font-display text-xs sm:text-sm font-semibold tracking-wider text-muted-foreground">
            ONE IDEA. <span className="text-primary">NO LIMITS.</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed max-w-sm">
            National open-innovation hackathon organized by <strong className="text-foreground">The Innovation League, Bhopal</strong>. Empowering student innovators from across India to solve real-world problems.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>DPDP Act 2023 & Indian Cyber Law Ready</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-md border border-border/70 bg-card/30 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary hover:shadow-[0_0_12px_-3px_rgba(225,29,72,0.4)]"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Footer Navigation">
          <p className="font-mono text-[0.65rem] font-semibold tracking-[0.18em] text-primary uppercase">
            EVENT NAVIGATION
          </p>
          <ul className="mt-3.5 space-y-2">
            {LINKS.map((l) => (
              <li key={l.label}>
                {l.isHash ? (
                  <a
                    href={l.to}
                    className="inline-block text-xs sm:text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.to}
                    className="inline-block text-xs sm:text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal & DPDP Compliance Links */}
        <nav aria-label="Legal and Compliance">
          <p className="font-mono text-[0.65rem] font-semibold tracking-[0.18em] text-primary uppercase">
            COMPLIANCE & PRIVACY
          </p>
          <ul className="mt-3.5 space-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="inline-block text-xs sm:text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-border/40 text-[0.7rem] text-muted-foreground/70">
            <p>Official Website: <a href="https://apexhack.online" className="text-primary hover:underline">https://apexhack.online</a></p>
            <p className="mt-0.5">Contact: support@apexhack.online</p>
          </div>
        </nav>
      </div>

      {/* Copyright Bar */}
      <div className="mx-auto mt-8 sm:mt-12 flex max-w-6xl flex-col gap-2 border-t border-border/40 pt-5 sm:flex-row sm:items-center sm:justify-between font-mono text-[0.6rem] sm:text-[0.65rem] tracking-wider text-muted-foreground/60">
        <p>© 2026 THE INNOVATION LEAGUE, BHOPAL. APEX 1.0. ALL RIGHTS RESERVED.</p>
        <p className="text-muted-foreground/40">HOSTED AT APEXHACK.ONLINE · SIGNAL: STABLE</p>
      </div>
    </footer>
  );
}
