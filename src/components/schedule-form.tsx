"use client";

import type { Schedule } from "@/db/schema";
import {
  BUILDING_LABELS,
  BUILDINGS,
  FREQUENCIES,
  FREQUENCY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  WORK_TYPE_LABELS,
  WORK_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/forms";
import type { Assignee } from "@/lib/queries";
import { ActionForm, SubmitButton } from "./form-controls";
import { ButtonLink, Card, Field, inputClass } from "./ui";

export function ScheduleForm({
  action,
  assignees,
  schedule,
  todayDate,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  assignees: Assignee[];
  schedule?: Schedule;
  todayDate: string;
}) {
  return (
    <ActionForm action={action} className="space-y-6">
      <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <Field label="Maintenance task" htmlFor="description" required className="sm:col-span-2">
          <textarea id="description" name="description" required rows={3} defaultValue={schedule?.description} placeholder="e.g. Inspect and service all fire extinguishers" className={inputClass} />
        </Field>
        <Field label="Type of work" htmlFor="type" required>
          <select id="type" name="type" required defaultValue={schedule?.type ?? ""} className={inputClass}>
            <option value="" disabled>Select type…</option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Repeats" htmlFor="frequency" required>
          <select id="frequency" name="frequency" required defaultValue={schedule?.frequency ?? "monthly"} className={inputClass}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
            ))}
          </select>
        </Field>
        <Field label="Building" htmlFor="building" required>
          <select id="building" name="building" required defaultValue={schedule?.building ?? ""} className={inputClass}>
            <option value="" disabled>Select building…</option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>{BUILDING_LABELS[b]}</option>
            ))}
          </select>
        </Field>
        <Field label="Classroom / area" htmlFor="classroom">
          <input id="classroom" name="classroom" defaultValue={schedule?.classroom ?? ""} placeholder="Leave empty for the whole building" className={inputClass} />
        </Field>
        <Field label={schedule ? "Next due date" : "First due date"} htmlFor="nextDueDate" required>
          <input id="nextDueDate" name="nextDueDate" type="date" required defaultValue={schedule?.nextDueDate ?? todayDate} className={inputClass} />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={schedule?.priority ?? "normal"} className={inputClass}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
        <Field label="Assign to" htmlFor="assignedToId" hint="Each generated work order is assigned to this person." className="sm:col-span-2">
          <select id="assignedToId" name="assignedToId" defaultValue={schedule?.assignedToId ?? ""} className={inputClass}>
            <option value="">Leave unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName}
                {a.jobTitle ? ` — ${a.jobTitle}` : ""}
              </option>
            ))}
          </select>
        </Field>
        {schedule && (
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={schedule.active} className="size-5 rounded border-slate-300" />
            <span className="text-sm text-slate-800">Active</span>
          </label>
        )}
      </Card>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href="/schedules" variant="secondary">Cancel</ButtonLink>
        <SubmitButton>{schedule ? "Save schedule" : "Create schedule"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
