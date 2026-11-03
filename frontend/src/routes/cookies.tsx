import { createFileRoute, Link } from "@tanstack/react-router";
import { Cookie, Check, Shield, RefreshCw, Sliders } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/site/page-header";
import { Reveal, Section, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy & Preferences — APEX 1.0" },
      {
        name: "description",
        content:
          "Official Cookie Policy and Consent Preferences for APEX 1.0 National Hackathon. Manage strictly necessary, functional, and analytical cookies.",
      },
      { property: "og:title", content: "Cookie Policy — APEX 1.0" },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: CookiePage,
});

export type CookiePreferences = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: "",
};

function CookiePage() {
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("apex_cookie_preferences");
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSave = (newPrefs: CookiePreferences) => {
    const updated = { ...newPrefs, necessary: true, updatedAt: new Date().toISOString() };
    setPrefs(updated);
    try {
      localStorage.setItem("apex_cookie_preferences", JSON.stringify(updated));
      setSaved(true);
      toast.success("COOKIE PREFERENCES SAVED", {
        description: "Your privacy preferences have been updated and stored securely.",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to save cookie preferences");
    }
  };

  const handleAcceptAll = () => {
    handleSave({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRejectOptional = () => {
    handleSave({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <PageHeader
        code="SYSTEM_14 / COOKIES"
        title="Cookie Policy & Preferences"
        subtitle="Manage your privacy and cookie preferences for APEX 1.0. Organizer: The Innovation League, Bhopal."
      />

      <Section className="py-8 sm:py-12">
        <Reveal>
          {/* Interactive Consent Control Panel */}
          <div className="rounded-xl border border-primary/40 bg-card/60 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
              <div>
                <SystemLabel className="text-primary text-xs">CONSENT CONTROLS</SystemLabel>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-foreground mt-1">
                  Customize Cookie Preferences
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-essential trackers are disabled by default under the Digital Personal Data Protection Act, 2023.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleRejectOptional} className="font-mono text-xs">
                  REJECT OPTIONAL
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="font-mono text-xs">
                  ACCEPT ALL
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {/* Strictly Necessary */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase text-foreground">1. Strictly Necessary Cookies</span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[0.65rem] text-primary">ALWAYS ACTIVE</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Essential for secure website navigation, session management, CSRF defense, and processing payments through Razorpay. These cannot be disabled.
                  </p>
                </div>
                <Checkbox checked={true} disabled className="mt-1" />
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-foreground">2. Functional & Preference Cookies</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enables the site to remember your team registration form drafts, UI theme settings, and accordion states.
                  </p>
                </div>
                <Checkbox
                  checked={prefs.functional}
                  onCheckedChange={(val) => setPrefs((p) => ({ ...p, functional: Boolean(val) }))}
                  className="mt-1"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-foreground">3. Analytics & Telemetry</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Aggregated, anonymized performance metrics helping us measure page load speeds, server health, and traffic spikes across colleges.
                  </p>
                </div>
                <Checkbox
                  checked={prefs.analytics}
                  onCheckedChange={(val) => setPrefs((p) => ({ ...p, analytics: Boolean(val) }))}
                  className="mt-1"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 bg-background/50 p-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-foreground">4. Marketing & Partner Notifications</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Allows us to notify team leaders regarding partner recruitment opportunities, workshops, and future hackathon seasons.
                  </p>
                </div>
                <Checkbox
                  checked={prefs.marketing}
                  onCheckedChange={(val) => setPrefs((p) => ({ ...p, marketing: Boolean(val) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
              <span className="font-mono text-[0.7rem] text-muted-foreground">
                {prefs.updatedAt ? `Last updated: ${new Date(prefs.updatedAt).toLocaleString()}` : "Using default privacy settings"}
              </span>
              <Button onClick={() => handleSave(prefs)} className="font-mono text-xs tracking-wider">
                SAVE PREFERENCES
              </Button>
            </div>
          </div>

          {/* Policy Information */}
          <div className="mt-10 space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <h3 className="font-display text-lg font-bold uppercase text-foreground">About Our Cookie Policy</h3>
            <p>
              Under the Digital Personal Data Protection Act, 2023, data fiduciaries are required to obtain purpose-specific, informed, and unbundled consent before processing non-essential personal information.
            </p>
            <p>
              The Innovation League does not deploy third-party advertising cookies, cross-site trackers, or behavioral profiling tools. All analytics remain privacy-preserving and aggregated.
            </p>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

