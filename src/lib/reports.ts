import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { profiles, workOrders } from "@/db/schema";
import { BUILDINGS, TIME_ZONE, WORK_TYPES, type Building, type WorkType } from "./constants";
import { hoursBetween, today } from "./dates";

export async function reportRows(from: string, to: string) {
  const assignee = alias(profiles, "assignee");
  return db
    .select({ wo: workOrders, assigneeName: assignee.fullName, assigneeTitle: assignee.jobTitle })
    .from(workOrders)
    .leftJoin(assignee, eq(assignee.id, workOrders.assignedToId))
    .where(and(gte(workOrders.reportedDate, from), lte(workOrders.reportedDate, to)))
    .orderBy(workOrders.id);
}
type Row = Awaited<ReturnType<typeof reportRows>>[number];

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const localDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
const isDone = (r: Row) => r.wo.status === "completed" || r.wo.status === "closed";
const isOpen = (r: Row) => !isDone(r);

export type TechnicianKpi = {
  id: string;
  name: string;
  title: string | null;
  assigned: number;
  completed: number;
  open: number;
  overdue: number;
  completionRate: number | null;
  avgResponseHours: number | null;
  avgResolutionHours: number | null;
  onTimeRate: number | null;
  reopened: number;
};

export function summarize(rows: Row[]) {
  const now = today();
  const overdue = (r: Row) => isOpen(r) && !!r.wo.dueDate && r.wo.dueDate < now;

  const byTech = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.wo.assignedToId) continue;
    byTech.set(r.wo.assignedToId, [...(byTech.get(r.wo.assignedToId) ?? []), r]);
  }

  const technicians: TechnicianKpi[] = [...byTech.entries()]
    .map(([id, rs]) => {
      const done = rs.filter(isDone);
      const withDue = done.filter((r) => r.wo.dueDate && r.wo.completedAt);
      return {
        id,
        name: rs[0].assigneeName ?? "Unknown",
        title: rs[0].assigneeTitle,
        assigned: rs.length,
        completed: done.length,
        open: rs.filter(isOpen).length,
        overdue: rs.filter(overdue).length,
        completionRate: rs.length ? done.length / rs.length : null,
        avgResponseHours: avg(rs.map((r) => hoursBetween(r.wo.assignedAt, r.wo.startedAt))),
        avgResolutionHours: avg(done.map((r) => hoursBetween(r.wo.assignedAt, r.wo.completedAt))),
        onTimeRate: withDue.length
          ? withDue.filter((r) => localDate(r.wo.completedAt!) <= r.wo.dueDate!).length / withDue.length
          : null,
        reopened: rs.reduce((n, r) => n + r.wo.reopenCount, 0),
      };
    })
    .sort((a, b) => b.completed - a.completed || a.name.localeCompare(b.name));

  const count = <K extends string>(keys: readonly K[], key: (r: Row) => K) =>
    keys.map((k) => {
      const rs = rows.filter((r) => key(r) === k);
      return { key: k, total: rs.length, open: rs.filter(isOpen).length };
    });

  const allDone = rows.filter(isDone);
  return {
    total: rows.length,
    completed: allDone.length,
    closed: rows.filter((r) => r.wo.status === "closed").length,
    open: rows.filter(isOpen).length,
    overdue: rows.filter(overdue).length,
    unassigned: rows.filter((r) => !r.wo.assignedToId).length,
    preventive: rows.filter((r) => r.wo.scheduleId).length,
    avgResolutionHours: avg(allDone.map((r) => hoursBetween(r.wo.assignedAt ?? r.wo.createdAt, r.wo.completedAt))),
    byType: count<WorkType>(WORK_TYPES, (r) => r.wo.type),
    byBuilding: count<Building>(BUILDINGS, (r) => r.wo.building),
    technicians,
  };
}

/** Default report range: the first of the current month up to today. */
export function defaultRange() {
  const t = today();
  return { from: `${t.slice(0, 8)}01`, to: t };
}

export function parseRange(params: { from?: string; to?: string }) {
  const d = defaultRange();
  const valid = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const from = valid(params.from) ?? d.from;
  const to = valid(params.to) ?? d.to;
  return from <= to ? { from, to } : { from: to, to: from };
}
