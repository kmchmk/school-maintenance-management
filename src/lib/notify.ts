import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { profiles, workOrders } from "@/db/schema";
import { APP_NAME, ASSIGNER_ROLES, BUILDING_LABELS, PRIORITY_LABELS, WORK_TYPE_LABELS } from "./constants";
import { formatDate, workOrderRef } from "./dates";
import { sendEmail } from "./email";

type NotifyEvent = "created" | "assigned" | "completed" | "closed" | "reopened";

function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const HEADLINES: Record<NotifyEvent, string> = {
  created: "A new work order needs to be assigned",
  assigned: "A work order has been assigned to you",
  completed: "A work order has been completed and is awaiting closure",
  closed: "A work order has been closed",
  reopened: "A work order has been reopened",
};

/** Emails the people who need to act on a work order event. */
export async function notifyWorkOrder(workOrderId: number, event: NotifyEvent, note?: string | null) {
  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId));
  if (!wo) return;

  let recipientIds: string[] = [];
  if (event === "assigned" || event === "reopened" || event === "closed") {
    if (wo.assignedToId) recipientIds = [wo.assignedToId];
  } else {
    // New work goes to the maintenance manager to assign; completed work goes to the
    // maintenance manager to close, and to whoever raised it.
    const managers = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(inArray(profiles.role, ASSIGNER_ROLES), eq(profiles.active, true)));
    recipientIds = managers.map((m) => m.id);
    if (event === "completed" && wo.createdById) recipientIds.push(wo.createdById);
  }
  if (recipientIds.length === 0) return;

  const recipients = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(and(inArray(profiles.id, recipientIds), eq(profiles.active, true)));
  const emails = recipients.map((r) => r.email).filter((e): e is string => !!e);
  if (emails.length === 0) return;

  const ref = workOrderRef(wo.id);
  const link = `${appUrl()}/work-orders/${wo.id}`;
  const rows: [string, string][] = [
    ["Type", WORK_TYPE_LABELS[wo.type]],
    ["Location", `${BUILDING_LABELS[wo.building]}${wo.classroom ? ` · ${wo.classroom}` : ""}`],
    ["Priority", PRIORITY_LABELS[wo.priority]],
    ["Reported by", wo.reportedBy],
    ["Reported on", formatDate(wo.reportedDate)],
    ...(wo.dueDate ? ([["Due", formatDate(wo.dueDate)]] as [string, string][]) : []),
  ];

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
    <h2 style="margin:0 0 8px">${HEADLINES[event]}</h2>
    <p style="margin:0 0 16px;color:#475569">${ref}</p>
    <p style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px">${escape(wo.description)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 0;color:#64748b">${k}</td><td style="padding:4px 0">${escape(v)}</td></tr>`).join("")}
    </table>
    ${note ? `<p><strong>Note:</strong> ${escape(note)}</p>` : ""}
    <p><a href="${link}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open ${ref}</a></p>
    <p style="color:#94a3b8;font-size:12px">${APP_NAME}</p>
  </div>`;

  await sendEmail(emails, `[${ref}] ${HEADLINES[event]}`, html);
}
