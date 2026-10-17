import "server-only";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { profiles, schedules, workOrderEvents, workOrders } from "@/db/schema";
import { addFrequency, today } from "./dates";
import { notifyWorkOrder } from "./notify";

/**
 * Creates a work order for every active schedule that is due, then moves the
 * schedule's next due date forward past today. Missed periods are skipped rather
 * than back-filled, so a long outage doesn't flood the queue.
 */
export async function generateDueWorkOrders(): Promise<number[]> {
  const now = today();
  const due = await db
    .select({ s: schedules, assigneeActive: profiles.active })
    .from(schedules)
    .leftJoin(profiles, eq(profiles.id, schedules.assignedToId))
    .where(and(eq(schedules.active, true), lte(schedules.nextDueDate, now)));

  const created: number[] = [];
  for (const { s, assigneeActive } of due) {
    const assignedToId = s.assignedToId && assigneeActive ? s.assignedToId : null;
    let next = s.nextDueDate;
    while (next <= now) next = addFrequency(next, s.frequency);

    // Claim the schedule first so overlapping runs can't create duplicates.
    const claimed = await db
      .update(schedules)
      .set({ nextDueDate: next, lastGeneratedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schedules.id, s.id), eq(schedules.nextDueDate, s.nextDueDate)))
      .returning({ id: schedules.id });
    if (claimed.length === 0) continue;

    const [wo] = await db
      .insert(workOrders)
      .values({
        reportedDate: now,
        reportedBy: "Preventive maintenance",
        type: s.type,
        building: s.building,
        classroom: s.classroom,
        description: s.description,
        priority: s.priority,
        dueDate: s.nextDueDate < now ? now : s.nextDueDate,
        status: assignedToId ? "assigned" : "open",
        assignedToId,
        assignedAt: assignedToId ? new Date() : null,
        scheduleId: s.id,
        createdById: s.createdById,
      })
      .returning({ id: workOrders.id });
    await db.insert(workOrderEvents).values({ workOrderId: wo.id, type: "created", note: "Created automatically from a preventive maintenance schedule." });
    created.push(wo.id);
    if (assignedToId) await notifyWorkOrder(wo.id, "assigned");
  }
  return created;
}
