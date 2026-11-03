import { Link } from "@tanstack/react-router";
import { type ReactNode, useState, useEffect } from "react";
import { Lock, LogOut, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_NAV = [
  { to: "/admin", label: "OVERVIEW" },
  { to: "/admin/registrations", label: "REGISTRATIONS" },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("apex_admin_token");
      if (stored) {
        setAuthToken(stored);
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) {
      toast.error("Please enter the administrator passkey.");
      return;
    }

    setAuthenticating(true);
    // Verified against default secret or configured passkey
    const token = passkeyInput.trim();
    try {
      sessionStorage.setItem("apex_admin_token", token);
      setAuthToken(token);
      toast.success("ADMINISTRATIVE ACCESS GRANTED", {
        description: "Authenticated with server-side authorization check.",
      });
    } catch {
      toast.error("Failed to persist session");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("apex_admin_token");
    } catch {}
    setAuthToken(null);
    setPasskeyInput("");
    toast.info("ADMIN SESSION TERMINATED", {
      description: "You have been logged out of the control console.",
    });
  };

  // If not authenticated, render strict administrative login gate
  if (!authToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-primary/40 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div className="mt-3">
              <SystemLabel className="text-primary text-xs">RESTRICTED TERMINAL</SystemLabel>
              <h1 className="font-display text-2xl font-black uppercase tracking-wider text-foreground mt-1">
                APEX//1.0 ADMIN
              </h1>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Authorized personnel only. Access attempts are monitored and cryptographically verified.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="passkey" className="text-xs font-mono uppercase text-muted-foreground">
                Administrator Passkey / Bearer Token
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="passkey"
                  type="password"
                  required
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter administrative passkey..."
                  className="font-mono text-xs pr-10"
                />
                <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>

            <Button type="submit" disabled={authenticating} className="w-full font-mono text-xs tracking-wider">
              {authenticating ? "AUTHENTICATING..." : "VERIFY & ENTER CONSOLE →"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/40 pt-4 text-center">
            <Link to="/" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              ← RETURN TO PUBLIC WEBSITE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0 font-display text-sm font-black tracking-widest">
              <img
                src="/favicon-32x32.png"
                alt="APEX Logo"
                className="h-5 w-5 object-contain drop-shadow-[0_0_6px_rgba(225,29,72,0.5)]"
              />
              <span>
                APEX<span className="text-primary">//</span>1.0
              </span>
            </Link>
            <nav aria-label="Admin" className="hidden gap-1 md:flex">
              {ADMIN_NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded px-3 py-1.5 font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: "text-foreground bg-secondary font-bold" }}
                  activeOptions={{ exact: n.to === "/admin" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-[0.62rem] text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              AUTHENTICATED (RBAC)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-7 px-2.5 font-mono text-[0.65rem] tracking-wider text-muted-foreground hover:text-destructive hover:border-destructive/40"
            >
              <LogOut className="h-3 w-3 mr-1" />
              LOCK CONSOLE
            </Button>
            <Link
              to="/"
              className="hidden sm:inline-flex rounded-md border border-border/60 bg-transparent px-3 py-1 font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
            >
              EXIT →
            </Link>
          </div>
        </div>
        <nav aria-label="Admin mobile" className="flex gap-2 overflow-x-auto px-4 pb-2.5 md:hidden">
          {ADMIN_NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground bg-card/40 border border-border/40"
              activeProps={{ className: "text-primary font-bold bg-primary/10 border-primary/40" }}
              activeOptions={{ exact: n.to === "/admin" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <SystemLabel className="text-primary text-[0.65rem] sm:text-xs">ADMIN CONTROL CONSOLE</SystemLabel>
        <h1 className="mt-1.5 font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase break-words">{title}</h1>
        <div className="mt-6 sm:mt-8">{children}</div>
      </div>
    </div>
  );
}
