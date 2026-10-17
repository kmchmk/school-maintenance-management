import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", ["open", "in_progress", "done"]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  priority: taskPriority("priority").notNull().default("medium"),
  status: taskStatus("status").notNull().default("open"),
  createdById: text("created_by_id").notNull(),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
