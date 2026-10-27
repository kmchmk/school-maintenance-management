import { getProfile, isManager } from "@/lib/auth";
import { BUILDING_LABELS, PRIORITY_LABELS, STATUS_LABELS, TIME_ZONE, WORK_TYPE_LABELS } from "@/lib/constants";
import { workOrderRef } from "@/lib/dates";
import { parseRange, reportRows } from "@/lib/reports";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const ts = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "short" }).format(d) : "";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile?.active || !isManager(profile.role)) return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const range = parseRange({ from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined });
  const rows = await reportRows(range.from, range.to);

  const header = [
    "Ref", "Date reported", "Reported by", "Type", "Building", "Classroom", "Description", "Priority", "Status",
    "Assigned to", "Assigned at", "Started at", "Completed at", "Closed at", "Due date", "Reopened", "Preventive", "Completion notes",
  ];
  const lines = rows.map(({ wo, assigneeName, helpers }) =>
    [
      workOrderRef(wo.id), wo.reportedDate, wo.reportedBy, WORK_TYPE_LABELS[wo.type], BUILDING_LABELS[wo.building], wo.classroom,
      wo.description, PRIORITY_LABELS[wo.priority], STATUS_LABELS[wo.status], [assigneeName, ...helpers.map((h) => h.name)].filter(Boolean).join(", "), ts(wo.assignedAt), ts(wo.startedAt),
      ts(wo.completedAt), ts(wo.closedAt), wo.dueDate, wo.reopenCount, wo.scheduleId ? "Yes" : "No", wo.completionNotes,
    ]
      .map(cell)
      .join(","),
  );

  return new Response("﻿" + [header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="work-orders-${range.from}-to-${range.to}.csv"`,
    },
  });
}
