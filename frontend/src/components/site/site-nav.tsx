import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  isHash?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "HOME" },
  { href: "/#roadmap", label: "ROADMAP", isHash: true },
  { href: "/rules", label: "RULES" },
  { href: "/prizes", label: "PRIZES" },
  { href: "/#sponsors", label: "SPONSORS", isHash: true },
  { href: "/faq", label: "FAQ" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const location = useLocation();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (location.pathname === "/" && window.scrollY < 240) {
        setActiveSection("home");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-10% 0px -40% 0px" }
    );

    const ids = ["roadmap", "sponsors"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hashTarget: string) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const targetId = hashTarget.replace("/#", "").replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        scrolled ? "px-2.5 pt-2 sm:px-4 sm:pt-2.5" : "px-2 sm:px-4 pt-1 sm:pt-2",
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ease-out",
          scrolled
            ? "glass-panel rounded-xl px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border-primary/30"
            : "rounded-xl border border-border/40 bg-background/70 px-4 py-2.5 sm:px-6 sm:py-3 backdrop-blur-md",
        )}
      >
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 font-display text-sm sm:text-base font-black tracking-widest text-foreground group shrink-0"
          onClick={() => setOpen(false)}
        >
          <img
            src="/favicon-32x32.png"
            alt="APEX Logo"
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
          />
          <span className="whitespace-nowrap">
            APEX<span className="text-primary">//</span>1.0
          </span>
        </Link>

        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {item.isHash ? (
                <a
                  href={item.href}
                  onClick={(e) => handleHashClick(e, item.href)}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.16em] transition-all duration-200 hover:text-foreground hover:bg-white/[0.06]",
                    activeSection === item.href.replace("/#", "")
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                  {activeSection === item.href.replace("/#", "") && (
                    <span className="absolute inset-x-2 -bottom-1 h-[2px] rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60 transition-all duration-300" />
                  )}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className="relative rounded-md px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-white/[0.06]"
                  activeProps={{ className: "text-foreground font-semibold" }}
                  activeOptions={{ exact: item.href === "/" }}
                >
                  {({ isActive }) => {
                    const isCurrent =
                      item.href === "/"
                        ? location.pathname === "/" && activeSection === "home"
                        : isActive;
                    return (
                      <>
                        {item.label}
                        {isCurrent && (
                          <span className="absolute inset-x-2 -bottom-1 h-[2px] rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60 transition-all duration-300" />
                        )}
                      </>
                    );
                  }}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" className="group hidden font-mono text-[0.7rem] tracking-[0.16em] bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-200 active:scale-[0.98] sm:inline-flex rounded-md min-h-[36px] px-3.5">
            <Link to="/register">
              REGISTER NOW <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 place-items-center rounded-lg border border-border/80 text-foreground bg-card/50 lg:hidden hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
          >
            {open ? <X className="h-5 w-5 text-primary transition-transform duration-200 rotate-90" /> : <Menu className="h-5 w-5 transition-transform duration-200" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer with smooth fade & slide */}
      <div
        className={cn(
          "fixed inset-0 top-[3.8rem] bg-black/70 backdrop-blur-sm lg:hidden z-40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-50 mx-auto mt-2 max-w-6xl px-3 lg:hidden transition-all duration-250 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <ul className="glass-panel grid gap-1 rounded-xl p-3 shadow-2xl border-primary/30 bg-background/95 backdrop-blur-2xl max-h-[calc(100svh-5rem)] overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {item.isHash ? (
                <a
                  href={item.href}
                  onClick={(e) => handleHashClick(e, item.href)}
                  className={cn(
                    "flex items-center min-h-[44px] rounded-lg px-4 py-2.5 font-mono text-xs tracking-[0.18em] transition-colors active:bg-primary/20",
                    activeSection === item.href.replace("/#", "")
                      ? "text-primary font-bold bg-primary/10"
                      : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-[44px] rounded-lg px-4 py-2.5 font-mono text-xs tracking-[0.18em] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors active:bg-primary/20"
                  activeProps={{ className: "text-primary font-bold bg-primary/10" }}
                  activeOptions={{ exact: item.href === "/" }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
          <li className="pt-2">
            <Button asChild className="w-full min-h-[44px] font-mono text-xs tracking-[0.18em] bg-primary text-primary-foreground glow-primary active:scale-[0.99]">
              <Link to="/register" onClick={() => setOpen(false)}>
                REGISTER NOW &rarr;
              </Link>
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
