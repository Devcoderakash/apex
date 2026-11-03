import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, Shield, Check, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type CookieConsentState = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const STORAGE_KEY = "apex_cookie_preferences";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so page loads smoothly before showing banner
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const saveConsent = (state: CookieConsentState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setVisible(false);
    } catch {}
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectOptional = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      necessary: true,
      functional,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 md:p-6 pointer-events-none"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-primary/40 bg-background/95 p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
                  Cookie & Privacy Consent
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[0.62rem] text-primary">
                  DPDP ACT 2023 READY
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-2xl">
                We use strictly necessary cookies to ensure secure registration and payment workflows. Non-essential analytical and functional cookies remain inactive unless you choose to accept them. Read our{" "}
                <Link to="/cookies" className="text-primary hover:underline font-semibold">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomize(!showCustomize)}
              className="font-mono text-xs tracking-wider"
            >
              <Sliders className="h-3 w-3 mr-1" />
              {showCustomize ? "HIDE" : "CUSTOMIZE"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectOptional}
              className="font-mono text-xs tracking-wider"
            >
              REJECT OPTIONAL
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="font-mono text-xs tracking-wider"
            >
              ACCEPT ALL
            </Button>
          </div>
        </div>

        {/* Detailed Category Checkboxes (Shown when Customize is clicked) */}
        {showCustomize && (
          <div className="mt-5 pt-4 border-t border-border/40 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">Necessary</span>
                <span className="font-mono text-[0.6rem] text-primary">ACTIVE</span>
              </div>
              <p className="mt-1 text-[0.68rem] text-muted-foreground leading-normal">
                Required for core security, payment sessions, and routing.
              </p>
            </div>

            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">Functional</span>
                <Checkbox
                  checked={functional}
                  onCheckedChange={(c) => setFunctional(Boolean(c))}
                />
              </div>
              <p className="mt-1 text-[0.68rem] text-muted-foreground leading-normal">
                Remembers draft form entries and accordion preferences.
              </p>
            </div>

            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">Analytics</span>
                <Checkbox
                  checked={analytics}
                  onCheckedChange={(c) => setAnalytics(Boolean(c))}
                />
              </div>
              <p className="mt-1 text-[0.68rem] text-muted-foreground leading-normal">
                Privacy-preserving metrics to measure site load times.
              </p>
            </div>

            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">Marketing</span>
                <Checkbox
                  checked={marketing}
                  onCheckedChange={(c) => setMarketing(Boolean(c))}
                />
              </div>
              <p className="mt-1 text-[0.68rem] text-muted-foreground leading-normal">
                Partner updates and notifications for future seasons.
              </p>
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveCustom} className="font-mono text-xs tracking-wider">
                SAVE CHOSEN PREFERENCES
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
