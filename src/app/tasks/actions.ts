"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tasks, type Task } from "@/db/schema";

const PRIORITIES: Task["priority"][] = ["low", "medium", "high"];
const STATUSES: Task["status"][] = ["open", "in_progress", "done"];

export async function createTask(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const priority = String(formData.get("priority")) as Task["priority"];
  const user = await currentUser();

  await db.insert(tasks).values({
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    priority: PRIORITIES.includes(priority) ? priority : "medium",
    createdById: userId,
    createdByName: user?.username ?? user?.fullName ?? null,
  });

  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: number, status: Task["status"]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!STATUSES.includes(status)) throw new Error("Invalid status");

  await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  revalidatePath("/tasks");
}
