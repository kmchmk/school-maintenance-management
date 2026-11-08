"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, schedules } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { ASSIGNABLE_ROLES, ASSIGNER_ROLES, BUILDINGS, FREQUENCIES, PRIORITIES, WORK_TYPES } from "@/lib/constants";
import { type ActionState, oneOf, optDate, optStr, str } from "@/lib/forms";
import { localDate, nextCustomDate, today } from "@/lib/dates";
import { generateDueWorkOrders } from "@/lib/schedules";

async function readSchedule(formData: FormData) {
  const assigneeId = optStr(formData, "assignedToId");
  let assignedToId: string | null = null;
  if (assigneeId) {
    const [p] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, assigneeId), eq(profiles.active, true), inArray(profiles.role, ASSIGNABLE_ROLES)));
    assignedToId = p?.id ?? null;
  }
  const frequency = oneOf(formData, "frequency", FREQUENCIES);
  // Custom dates repeat every year, so only the month and day are kept.
  const customDates =
    frequency === "custom"
      ? [...new Set(formData.getAll("customDates").map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).map((d) => d.slice(5)))].sort()
      : [];
  return {
    description: str(formData, "description"),
    details: optStr(formData, "details"),
    type: oneOf(formData, "type", WORK_TYPES),
    building: oneOf(formData, "building", BUILDINGS),
    classroom: optStr(formData, "classroom"),
    priority: oneOf(formData, "priority", PRIORITIES, "normal"),
    frequency,
    customDates,
    nextDueDate: frequency === "custom" ? nextCustomDate(today(), customDates, true) : optDate(formData, "nextDueDate"),
    assignedToId,
  };
}

export async function createSchedule(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(ASSIGNER_ROLES);
  const data = await readSchedule(formData);
  if (!data.description) return { error: "Describe the maintenance task." };
  if (data.frequency === "custom" && data.customDates.length === 0) return { error: "Add at least one date." };
  if (!data.nextDueDate) return { error: "Choose when it is first due." };
  await db.insert(schedules).values({ ...data, nextDueDate: data.nextDueDate, createdById: me.id });
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function updateSchedule(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(ASSIGNER_ROLES);
  const data = await readSchedule(formData);
  if (!data.description) return { error: "Describe the maintenance task." };
  if (data.frequency === "custom") {
    if (data.customDates.length === 0) return { error: "Add at least one date." };
    // Don't repeat today's work order if it was already created today.
    const [current] = await db.select({ last: schedules.lastGeneratedAt }).from(schedules).where(eq(schedules.id, id));
    const doneToday = !!current?.last && localDate(current.last) >= today();
    data.nextDueDate = nextCustomDate(today(), data.customDates, !doneToday);
  }
  if (!data.nextDueDate) return { error: "Choose the next due date." };
  await db
    .update(schedules)
    .set({ ...data, nextDueDate: data.nextDueDate, active: formData.get("active") === "on", updatedAt: new Date() })
    .where(eq(schedules.id, id));
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function deleteSchedule(id: number): Promise<void> {
  await requireProfile(ASSIGNER_ROLES);
  await db.delete(schedules).where(eq(schedules.id, id));
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function runSchedulesNow(): Promise<ActionState> {
  await requireProfile(ASSIGNER_ROLES);
  const created = await generateDueWorkOrders();
  revalidatePath("/", "layout");
  return { ok: created.length ? `Created ${created.length} work order${created.length > 1 ? "s" : ""}.` : "Nothing is due yet." };
}
