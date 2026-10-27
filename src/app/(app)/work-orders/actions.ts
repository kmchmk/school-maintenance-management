"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/db";
import { profiles, workOrderEvents, workOrderHelpers, workOrders, type Profile, type WorkOrder } from "@/db/schema";
import { canAssign, isManager, requireProfile } from "@/lib/auth";
import { ASSIGNABLE_ROLES, ASSIGNER_ROLES, BUILDINGS, CREATOR_ROLES, PRIORITIES, WORK_TYPES } from "@/lib/constants";
import { today } from "@/lib/dates";
import { type ActionState, oneOf, optDate, optStr, str } from "@/lib/forms";
import { notifyWorkOrder } from "@/lib/notify";
import { photoFiles, savePhotos, validatePhotos } from "@/lib/photos";
import { isOnTeam } from "@/lib/queries";

async function loadWorkOrder(id: number): Promise<WorkOrder> {
  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id));
  if (!wo) throw new Error("Work order not found");
  return wo;
}

/** Active, assignable people among these ids, with their names (in the order given). */
async function validAssignees(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: profiles.id, name: profiles.fullName })
    .from(profiles)
    .where(and(inArray(profiles.id, ids), eq(profiles.active, true), inArray(profiles.role, ASSIGNABLE_ROLES)));
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r) => !!r);
}

/** The lead ("assignedToId") and any extra people ("helperIds") picked in a form. */
async function readTeam(formData: FormData) {
  const leadId = optStr(formData, "assignedToId");
  const [lead] = leadId ? await validAssignees([leadId]) : [];
  if (!lead) return null;
  const helperIds = [...new Set(formData.getAll("helperIds").map(String))].filter((id) => id && id !== lead.id);
  return { lead, helpers: await validAssignees(helperIds) };
}

async function setHelpers(workOrderId: number, helperIds: string[]) {
  await db.delete(workOrderHelpers).where(eq(workOrderHelpers.workOrderId, workOrderId));
  if (helperIds.length) await db.insert(workOrderHelpers).values(helperIds.map((profileId) => ({ workOrderId, profileId })));
}

const teamNote = (team: { lead: { name: string }; helpers: { name: string }[] }) =>
  `Assigned to ${[team.lead.name, ...team.helpers.map((h) => h.name)].join(", ")}`;

async function logEvent(workOrderId: number, actor: Profile, type: typeof workOrderEvents.$inferInsert.type, note?: string | null) {
  await db.insert(workOrderEvents).values({ workOrderId, actorId: actor.id, type, note: note || null });
}

/** The people on the job do the work; the maintenance manager can also update it on their behalf. */
async function canWork(profile: Profile, wo: WorkOrder) {
  return canAssign(profile.role) || (await isOnTeam(wo.id, wo.assignedToId, profile.id));
}

async function canView(profile: Profile, wo: WorkOrder) {
  return isManager(profile.role) || (await isOnTeam(wo.id, wo.assignedToId, profile.id));
}

function refresh(id?: number) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/work-orders/${id}`);
}

function readDetails(formData: FormData) {
  return {
    reportedDate: optDate(formData, "reportedDate") ?? today(),
    reportedBy: str(formData, "reportedBy"),
    type: oneOf(formData, "type", WORK_TYPES),
    building: oneOf(formData, "building", BUILDINGS),
    classroom: optStr(formData, "classroom"),
    description: str(formData, "description"),
    priority: oneOf(formData, "priority", PRIORITIES, "normal"),
    dueDate: optDate(formData, "dueDate"),
  };
}

export async function createWorkOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(CREATOR_ROLES);
  const details = readDetails(formData);
  if (!details.reportedBy) return { error: "Enter who reported the issue." };
  if (!details.description) return { error: "Enter a work description." };

  const files = photoFiles(formData);
  const photoError = validatePhotos(files);
  if (photoError) return { error: photoError };

  const team = canAssign(me.role) ? await readTeam(formData) : null;
  const assignedToId = team?.lead.id ?? null;
  const now = new Date();
  const [wo] = await db
    .insert(workOrders)
    .values({
      ...details,
      dueDate: canAssign(me.role) ? details.dueDate : null,
      status: assignedToId ? "assigned" : "open",
      assignedToId,
      assignedAt: assignedToId ? now : null,
      createdById: me.id,
    })
    .returning({ id: workOrders.id });

  await logEvent(wo.id, me, "created");
  if (team) {
    await setHelpers(wo.id, team.helpers.map((h) => h.id));
    await logEvent(wo.id, me, "assigned", teamNote(team));
    after(() => notifyWorkOrder(wo.id, "assigned"));
  } else {
    after(() => notifyWorkOrder(wo.id, "created"));
  }
  await savePhotos(wo.id, "report", files, me.id);

  refresh();
  redirect(`/work-orders/${wo.id}?created=1`);
}

export async function updateWorkOrder(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(CREATOR_ROLES);
  const wo = await loadWorkOrder(id);
  const details = readDetails(formData);
  if (!details.reportedBy) return { error: "Enter who reported the issue." };
  if (!details.description) return { error: "Enter a work description." };

  // Only the maintenance manager sets due dates, as part of assigning the work.
  const { dueDate, ...rest } = details;
  await db
    .update(workOrders)
    .set({ ...rest, ...(canAssign(me.role) ? { dueDate } : {}), updatedAt: new Date() })
    .where(eq(workOrders.id, wo.id));
  await logEvent(wo.id, me, "updated");
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}`);
}

export async function assignWorkOrder(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(ASSIGNER_ROLES);
  const wo = await loadWorkOrder(id);
  if (wo.status === "completed" || wo.status === "closed") {
    return { error: "Reopen the work order before reassigning it." };
  }
  const team = await readTeam(formData);
  if (!team) return { error: "Choose who should lead the work." };
  const before = await db
    .select({ id: workOrderHelpers.profileId })
    .from(workOrderHelpers)
    .where(eq(workOrderHelpers.workOrderId, wo.id));
  const oldTeam = new Set([wo.assignedToId, ...before.map((b) => b.id)]);
  const newTeam = [team.lead.id, ...team.helpers.map((h) => h.id)];
  const dueDate = optDate(formData, "dueDate") ?? wo.dueDate;
  const leadChanged = team.lead.id !== wo.assignedToId;
  const helpersChanged = before.length !== team.helpers.length || newTeam.some((id) => !oldTeam.has(id));
  if (!leadChanged && !helpersChanged && dueDate === wo.dueDate) return { ok: "No changes." };

  // A new lead starts the job afresh; adding or removing helpers keeps its progress.
  await db
    .update(workOrders)
    .set({
      assignedToId: team.lead.id,
      dueDate,
      updatedAt: new Date(),
      ...(leadChanged ? { assignedAt: new Date(), startedAt: null, status: "assigned" as const } : {}),
    })
    .where(eq(workOrders.id, wo.id));
  await setHelpers(wo.id, team.helpers.map((h) => h.id));

  await logEvent(wo.id, me, "assigned", teamNote(team));
  const added = newTeam.filter((id) => !oldTeam.has(id));
  if (added.length) after(() => notifyWorkOrder(wo.id, "assigned", null, added));
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}?done=assigned`);
}

export async function startWorkOrder(id: number): Promise<void> {
  const me = await requireProfile();
  const wo = await loadWorkOrder(id);
  if (!(await canWork(me, wo)) || wo.status !== "assigned") return;
  await db.update(workOrders).set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() }).where(eq(workOrders.id, wo.id));
  await logEvent(wo.id, me, "started");
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}?done=started`);
}

export async function completeWorkOrder(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const wo = await loadWorkOrder(id);
  if (!(await canWork(me, wo))) return { error: "Only the people assigned can complete this work order." };
  if (wo.status !== "assigned" && wo.status !== "in_progress") return { error: "This work order is not open for completion." };

  // Photos are optional proof of the completed work.
  const files = photoFiles(formData);
  const photoError = validatePhotos(files);
  if (photoError) return { error: photoError };

  const notes = optStr(formData, "notes");
  const now = new Date();
  await db
    .update(workOrders)
    .set({ status: "completed", completedAt: now, startedAt: wo.startedAt ?? now, completionNotes: notes, updatedAt: now })
    .where(eq(workOrders.id, wo.id));
  await savePhotos(wo.id, "completion", files, me.id);
  await logEvent(wo.id, me, "completed", notes);
  after(() => notifyWorkOrder(wo.id, "completed", notes));
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}?done=completed`);
}

export async function closeWorkOrder(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(ASSIGNER_ROLES);
  const wo = await loadWorkOrder(id);
  if (wo.status !== "completed") return { error: "Only completed work orders can be closed." };
  const note = optStr(formData, "note");
  await db.update(workOrders).set({ status: "closed", closedAt: new Date(), closedById: me.id, updatedAt: new Date() }).where(eq(workOrders.id, wo.id));
  await logEvent(wo.id, me, "closed", note);
  after(() => notifyWorkOrder(wo.id, "closed", note));
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}?done=closed`);
}

export async function reopenWorkOrder(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(ASSIGNER_ROLES);
  const wo = await loadWorkOrder(id);
  if (wo.status !== "completed" && wo.status !== "closed") return { error: "Only completed or closed work orders can be reopened." };
  const note = optStr(formData, "note");
  if (!note) return { error: "Explain why the work order is being reopened." };
  await db
    .update(workOrders)
    .set({
      status: wo.assignedToId ? "assigned" : "open",
      startedAt: null,
      completedAt: null,
      closedAt: null,
      closedById: null,
      reopenCount: wo.reopenCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, wo.id));
  await logEvent(wo.id, me, "reopened", note);
  after(() => notifyWorkOrder(wo.id, "reopened", note));
  refresh(wo.id);
  redirect(`/work-orders/${wo.id}?done=reopened`);
}

export async function addComment(id: number, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const wo = await loadWorkOrder(id);
  if (!(await canView(me, wo))) return { error: "You can't comment on this work order." };
  const note = optStr(formData, "note");
  if (!note) return { error: "Write a comment first." };
  await logEvent(wo.id, me, "comment", note);
  refresh(wo.id);
  return { ok: "Comment added." };
}

export async function deleteWorkOrder(id: number): Promise<void> {
  const me = await requireProfile(ASSIGNER_ROLES);
  if (!canAssign(me.role)) return;
  await db.delete(workOrders).where(eq(workOrders.id, id));
  refresh();
  redirect("/work-orders");
}
