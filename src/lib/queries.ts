import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { profiles, workOrderEvents, workOrderHelpers, workOrderPhotos, workOrders, type Profile } from "@/db/schema";
import { isManager } from "./auth";
import { ASSIGNABLE_ROLES, BUILDINGS, STATUSES, WORK_TYPES, type Building, type Status, type WorkType } from "./constants";
import { today } from "./dates";

export async function listAssignees() {
  return db
    .select({ id: profiles.id, fullName: profiles.fullName, jobTitle: profiles.jobTitle, role: profiles.role })
    .from(profiles)
    .where(and(eq(profiles.active, true), inArray(profiles.role, ASSIGNABLE_ROLES)))
    .orderBy(asc(profiles.fullName));
}
export type Assignee = Awaited<ReturnType<typeof listAssignees>>[number];

export type WorkOrderFilters = {
  status?: string;
  type?: string;
  building?: string;
  assignee?: string;
  q?: string;
};

const assignee = alias(profiles, "assignee");

export const OPEN_STATUSES: Status[] = ["open", "assigned", "in_progress"];

/** Condition for work that is past its due date and not yet done. */
export const overdueCondition = () =>
  and(inArray(workOrders.status, OPEN_STATUSES), lt(workOrders.dueDate, today()));

/** Work this person leads or is helping on. */
export const onTeamCondition = (profileId: string) =>
  or(
    eq(workOrders.assignedToId, profileId),
    sql`exists (select 1 from ${workOrderHelpers} where ${workOrderHelpers.workOrderId} = ${workOrders.id} and ${workOrderHelpers.profileId} = ${profileId})`,
  );

export type Helper = { workOrderId: number; id: string; name: string; title: string | null };

/** The extra people on each of these work orders (everyone besides the lead), by work order id. */
export async function helpersFor(workOrderIds: number[]): Promise<Map<number, Helper[]>> {
  const map = new Map<number, Helper[]>();
  if (workOrderIds.length === 0) return map;
  const rows = await db
    .select({ workOrderId: workOrderHelpers.workOrderId, id: profiles.id, name: profiles.fullName, title: profiles.jobTitle })
    .from(workOrderHelpers)
    .innerJoin(profiles, eq(profiles.id, workOrderHelpers.profileId))
    .where(inArray(workOrderHelpers.workOrderId, workOrderIds))
    .orderBy(asc(profiles.fullName));
  for (const r of rows) map.set(r.workOrderId, [...(map.get(r.workOrderId) ?? []), r]);
  return map;
}

/** Whether this person leads or helps on the work order. */
export async function isOnTeam(workOrderId: number, assignedToId: string | null, profileId: string) {
  if (assignedToId === profileId) return true;
  const [row] = await db
    .select({ id: workOrderHelpers.profileId })
    .from(workOrderHelpers)
    .where(and(eq(workOrderHelpers.workOrderId, workOrderId), eq(workOrderHelpers.profileId, profileId)));
  return !!row;
}

/** Technicians and drivers only see their own work, unless `everyone` is set (the read-only Board). */
export async function listWorkOrders(viewer: Profile, filters: WorkOrderFilters, limit = 100, everyone = false) {
  const where: (SQL | undefined)[] = [];

  if (!everyone && !isManager(viewer.role)) where.push(onTeamCondition(viewer.id));

  const status = filters.status || "active";
  if (status === "active") where.push(ne(workOrders.status, "closed"));
  else if (status === "overdue") where.push(overdueCondition());
  else if (STATUSES.includes(status as Status)) where.push(eq(workOrders.status, status as Status));

  if (WORK_TYPES.includes(filters.type as WorkType)) where.push(eq(workOrders.type, filters.type as WorkType));
  if (BUILDINGS.includes(filters.building as Building)) where.push(eq(workOrders.building, filters.building as Building));

  if (filters.assignee === "me") where.push(onTeamCondition(viewer.id));
  else if (filters.assignee === "unassigned") where.push(isNull(workOrders.assignedToId));
  else if (filters.assignee) where.push(onTeamCondition(filters.assignee));

  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    const idMatch = q.replace(/^wo-?/i, "");
    where.push(
      or(
        ilike(workOrders.description, like),
        ilike(workOrders.reportedBy, like),
        ilike(workOrders.classroom, like),
        /^\d+$/.test(idMatch) ? eq(workOrders.id, Number(idMatch)) : undefined,
      ),
    );
  }

  const rows = await db
    .select({
      id: workOrders.id,
      description: workOrders.description,
      type: workOrders.type,
      building: workOrders.building,
      classroom: workOrders.classroom,
      priority: workOrders.priority,
      status: workOrders.status,
      reportedDate: workOrders.reportedDate,
      reportedBy: workOrders.reportedBy,
      dueDate: workOrders.dueDate,
      completedAt: workOrders.completedAt,
      assignedToId: workOrders.assignedToId,
      assigneeName: assignee.fullName,
      assigneeTitle: assignee.jobTitle,
    })
    .from(workOrders)
    .leftJoin(assignee, eq(assignee.id, workOrders.assignedToId))
    .where(and(...where))
    .orderBy(
      sql`case ${workOrders.priority} when 'urgent' then 0 when 'high' then 1 else 2 end`,
      desc(workOrders.reportedDate),
      desc(workOrders.id),
    )
    .limit(limit);
  const helpers = await helpersFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, helpers: helpers.get(r.id) ?? [] }));
}
export type WorkOrderRow = Awaited<ReturnType<typeof listWorkOrders>>[number];

export async function getWorkOrderDetail(id: number) {
  const creator = alias(profiles, "creator");
  const closer = alias(profiles, "closer");
  const [row] = await db
    .select({
      wo: workOrders,
      assigneeName: assignee.fullName,
      creatorName: creator.fullName,
      closerName: closer.fullName,
    })
    .from(workOrders)
    .leftJoin(assignee, eq(assignee.id, workOrders.assignedToId))
    .leftJoin(creator, eq(creator.id, workOrders.createdById))
    .leftJoin(closer, eq(closer.id, workOrders.closedById))
    .where(eq(workOrders.id, id));
  if (!row) return null;

  const [photos, events, helpers] = await Promise.all([
    db
      .select({ id: workOrderPhotos.id, kind: workOrderPhotos.kind, createdAt: workOrderPhotos.createdAt })
      .from(workOrderPhotos)
      .where(eq(workOrderPhotos.workOrderId, id))
      .orderBy(asc(workOrderPhotos.id)),
    db
      .select({
        id: workOrderEvents.id,
        type: workOrderEvents.type,
        note: workOrderEvents.note,
        createdAt: workOrderEvents.createdAt,
        actorName: profiles.fullName,
      })
      .from(workOrderEvents)
      .leftJoin(profiles, eq(profiles.id, workOrderEvents.actorId))
      .where(eq(workOrderEvents.workOrderId, id))
      .orderBy(desc(workOrderEvents.createdAt), desc(workOrderEvents.id)),
    helpersFor([id]).then((m) => m.get(id) ?? []),
  ]);

  return { ...row, photos, events, helpers };
}
