import { desc } from "drizzle-orm";
import { db } from "@/db";
import { tasks, type Task } from "@/db/schema";
import { createTask, updateTaskStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<Task["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default async function TasksPage() {
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">New maintenance task</h2>
        <form action={createTask} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="What needs fixing?"
            className="rounded-md border px-3 py-2 sm:col-span-2"
          />
          <input
            name="location"
            placeholder="Location (e.g. Room 12, Block B)"
            className="rounded-md border px-3 py-2"
          />
          <select name="priority" defaultValue="medium" className="rounded-md border px-3 py-2">
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <textarea
            name="description"
            placeholder="Details (optional)"
            rows={3}
            className="rounded-md border px-3 py-2 sm:col-span-2"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 sm:col-span-2 sm:justify-self-start">
            Add task
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Tasks ({allTasks.length})</h2>
        {allTasks.length === 0 ? (
          <p className="mt-4 text-slate-500">No tasks yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {allTasks.map((task) => (
              <li key={task.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={`font-medium ${task.status === "done" ? "line-through text-slate-400" : ""}`}>
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {task.location && <>📍 {task.location} · </>}
                      {task.createdByName ?? "Unknown"} ·{" "}
                      {task.createdAt.toLocaleDateString()}
                    </p>
                    {task.description && (
                      <p className="mt-2 text-sm whitespace-pre-wrap">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    {(Object.keys(STATUS_LABELS) as Task["status"][]).map((status) => (
                      <form key={status} action={updateTaskStatus.bind(null, task.id, status)}>
                        <button
                          disabled={task.status === status}
                          className="rounded-md border px-2 py-1 text-xs disabled:bg-slate-900 disabled:text-white"
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
