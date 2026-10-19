"use client";

import {
  BarChart3,
  LayoutList,
  CalendarClock,
  ClipboardList,
  House,
  Menu,
  Plus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/constants";
import { cn } from "./ui";

type Item = { href: string; label: string; icon: LucideIcon; roles?: Role[] };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/work-orders", label: "Work orders", icon: ClipboardList },
  { href: "/work-orders/new", label: "New", icon: Plus, roles: ["admin", "supervisor"] },
  { href: "/board", label: "Board", icon: LayoutList, roles: ["admin", "supervisor"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "supervisor"] },
  { href: "/schedules", label: "Preventive", icon: CalendarClock, roles: ["admin", "supervisor"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
];

function isActive(pathname: string, href: string) {
  if (href === "/work-orders") return pathname === href || /^\/work-orders\/\d+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.roles || i.roles.includes(role));
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, href) ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Bottom tab bar on phones: up to four primary items plus a "More" sheet. */
export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = ITEMS.filter((i) => !i.roles || i.roles.includes(role));
  const primary = items.slice(0, 4);
  const overflow = items.slice(4);

  return (
    <>
      {open && overflow.length > 0 && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {overflow.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base",
                  isActive(pathname, href) ? "bg-brand-50 text-brand-700" : "text-slate-800",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            const isNew = href === "/work-orders/new";
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-brand-700" : "text-slate-500")}
                >
                  <span className={cn("flex size-7 items-center justify-center rounded-full", isNew && "bg-brand-700 text-white")}>
                    <Icon className="size-5" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
          {overflow.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className={cn("flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium", open ? "text-brand-700" : "text-slate-500")}
              >
                <span className="flex size-7 items-center justify-center">{open ? <X className="size-5" /> : <Menu className="size-5" />}</span>
                More
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
