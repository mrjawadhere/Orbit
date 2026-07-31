import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";

import { OrbitLogo } from "@/components/orbit/logo";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "#features" },
  { label: "Orbit AI", href: "#ai" },
  { label: "Analytics", href: "#analytics" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = links
      .map((l) => document.querySelector(l.href))
      .filter((el): el is Element => Boolean(el));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0.01, 0.25] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6"
      >
        <a href="#top" className="flex shrink-0 items-center">
          <OrbitLogo />
          <span className="sr-only">Orbit home</span>
        </a>

        <ul className="hidden flex-1 items-center gap-1 pl-4 md:flex">
          {links.map((link) => {
            const isActive = active === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <Link
            to="/auth"
            className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="hidden h-9 items-center rounded-md bg-signal px-4 text-sm font-semibold text-signal-foreground shadow-[var(--shadow-plate)] transition-transform hover:-translate-y-px active:translate-y-0 sm:flex"
          >
            Start free
          </Link>

          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-card px-4 py-3 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/auth"
              className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-secondary"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-md bg-signal px-4 py-2.5 text-center text-sm font-semibold text-signal-foreground"
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
