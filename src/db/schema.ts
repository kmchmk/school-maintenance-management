import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { BUILDINGS, FREQUENCIES, PRIORITIES, ROLES, STATUSES, WORK_TYPES } from "@/lib/constants";

const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType: () => "bytea",
  fromDriver: (value) =>
    typeof value === "string" ? Buffer.from(value.replace(/^\\x/, ""), "hex") : Buffer.from(value),
});

export const roleEnum = pgEnum("role", ROLES);
export const workTypeEnum = pgEnum("work_type", WORK_TYPES);
export const buildingEnum = pgEnum("building", BUILDINGS);
export const priorityEnum = pgEnum("priority", PRIORITIES);
export const statusEnum = pgEnum("work_order_status", STATUSES);
export const frequencyEnum = pgEnum("frequency", FREQUENCIES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** App-level user record; the id is the Clerk user id. Clerk only handles sign-in. */
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  username: text("username"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  jobTitle: text("job_title"),
  role: roleEnum("role").notNull().default("pending"),
  active: boolean("active").notNull().default(true),
  /** Set when an admin deletes the account. The row stays so work order history keeps the name. */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  type: workTypeEnum("type").notNull(),
  building: buildingEnum("building").notNull(),
  classroom: text("classroom"),
  priority: priorityEnum("priority").notNull().default("normal"),
  assignedToId: text("assigned_to_id").references(() => profiles.id),
  frequency: frequencyEnum("frequency").notNull(),
  nextDueDate: date("next_due_date").notNull(),
  active: boolean("active").notNull().default(true),
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),
  createdById: text("created_by_id").references(() => profiles.id),
  ...timestamps,
});

export const workOrders = pgTable(
  "work_orders",
  {
    id: serial("id").primaryKey(),
    reportedDate: date("reported_date").notNull().default(sql`CURRENT_DATE`),
    reportedBy: text("reported_by").notNull(),
    type: workTypeEnum("type").notNull(),
    building: buildingEnum("building").notNull(),
    classroom: text("classroom"),
    description: text("description").notNull(),
    priority: priorityEnum("priority").notNull().default("normal"),
    status: statusEnum("status").notNull().default("open"),
    dueDate: date("due_date"),
    assignedToId: text("assigned_to_id").references(() => profiles.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completionNotes: text("completion_notes"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedById: text("closed_by_id").references(() => profiles.id),
    reopenCount: integer("reopen_count").notNull().default(0),
    scheduleId: integer("schedule_id").references(() => schedules.id, { onDelete: "set null" }),
    createdById: text("created_by_id").references(() => profiles.id),
    ...timestamps,
  },
  (t) => [
    index("work_orders_status_idx").on(t.status),
    index("work_orders_assigned_to_idx").on(t.assignedToId),
    index("work_orders_reported_date_idx").on(t.reportedDate),
  ],
);

export const workOrderPhotos = pgTable(
  "work_order_photos",
  {
    id: serial("id").primaryKey(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["report", "completion"] }).notNull(),
    contentType: text("content_type").notNull(),
    data: bytea("data").notNull(),
    uploadedById: text("uploaded_by_id").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("work_order_photos_work_order_idx").on(t.workOrderId)],
);

export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: serial("id").primaryKey(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => profiles.id),
    type: text("type", {
      enum: ["created", "updated", "assigned", "started", "completed", "closed", "reopened", "comment"],
    }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("work_order_events_work_order_idx").on(t.workOrderId)],
);

export type Profile = typeof profiles.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type WorkOrderEvent = typeof workOrderEvents.$inferSelect;
