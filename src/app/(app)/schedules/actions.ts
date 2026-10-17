"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, schedules } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { BUILDINGS, FREQUENCIES, PRIORITIES, WORK_TYPES } from "@/lib/constants";
import { type ActionState, oneOf, optDate, optStr, str } from "@/lib/forms";
import { generateDueWorkOrders } from "@/lib/schedules";

async function readSchedule(formData: FormData) {
  const assigneeId = optStr(formData, "assignedToId");
  let assignedToId: string | null = null;
  if (assigneeId) {
    const [p] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, assigneeId), eq(profiles.active, true), inArray(profiles.role, ["admin", "supervisor", "staff"])));
    assignedToId = p?.id ?? null;
  }
  return {
    description: str(formData, "description"),
    type: oneOf(formData, "type", WORK_TYPES),
    building: oneOf(formData, "building", BUILDINGS),
    classroom: optStr(formData, "classroom"),
    priority: oneOf(formData, "priority", PRIORITIES, "normal"),
    frequency: oneOf(formData, "frequency", FREQUENCIES),
    nextDueDate: optDate(formData, "nextDueDate"),
    assignedToId,
  };
}

export async function createSchedule(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(["admin", "supervisor"]);
  const data = await readSchedule(formData);
  if (!data.description) return { error: "Describe the maintenance task." };
  if (!data.nextDueDate) return { error: "Choose when it is first due." };
  await db.insert(schedules).values({ ...data, nextDueDate: data.nextDueDate, createdById: me.id });
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function updateSchedule(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(["admin", "supervisor"]);
  const data = await readSchedule(formData);
  if (!data.description) return { error: "Describe the maintenance task." };
  if (!data.nextDueDate) return { error: "Choose the next due date." };
  await db
    .update(schedules)
    .set({ ...data, nextDueDate: data.nextDueDate, active: formData.get("active") === "on", updatedAt: new Date() })
    .where(eq(schedules.id, id));
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function deleteSchedule(id: number): Promise<void> {
  await requireProfile(["admin", "supervisor"]);
  await db.delete(schedules).where(eq(schedules.id, id));
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function runSchedulesNow(): Promise<ActionState> {
  await requireProfile(["admin", "supervisor"]);
  const created = await generateDueWorkOrders();
  revalidatePath("/", "layout");
  return { ok: created.length ? `Created ${created.length} work order${created.length > 1 ? "s" : ""}.` : "Nothing is due yet." };
}
