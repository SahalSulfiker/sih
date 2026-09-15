"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Anchor, Bell, Menu, User, X } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/analyze", label: "New Analysis" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-ink-900">
            <Anchor className="h-[18px] w-[18px] text-marine-700" aria-hidden />
            <span className="text-[15px] font-semibold tracking-tight">FreightIQ</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "bg-marine-100 text-marine-900"
                      : "text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            className="rounded-md p-2 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-marine-100 text-marine-900"
            aria-label="Account"
          >
            <User className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-ink-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-surface px-4 py-3 md:hidden"
          aria-label="Primary"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-marine-100 text-marine-900" : "text-ink-700 hover:bg-ink-900/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
