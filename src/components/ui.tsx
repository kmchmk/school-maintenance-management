import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Priority,
  type Status,
} from "@/lib/constants";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-h-11",
  primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost: "text-slate-700 hover:bg-slate-100",
};

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link className={cn(btn.base, btn[variant], className)} {...props} />;
}

export const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:text-sm";

export function Field({ label, htmlFor, hint, required, children, className }: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-slate-100 text-slate-700 ring-slate-300",
  assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-200",
  completed: "bg-violet-50 text-violet-700 ring-violet-200",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "text-slate-500",
  normal: "text-slate-600",
  high: "text-orange-600",
  urgent: "text-red-600 font-semibold",
};

export function PriorityText({ priority }: { priority: Priority }) {
  return <span className={cn("text-xs", PRIORITY_STYLES[priority])}>{PRIORITY_LABELS[priority]}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warning"; children: ReactNode }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", styles[tone])}>
      {children}
    </div>
  );
}
