"use client";

import type { WorkOrder } from "@/db/schema";
import {
  BUILDING_LABELS,
  BUILDINGS,
  PRIORITIES,
  PRIORITY_LABELS,
  WORK_TYPE_LABELS,
  WORK_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/forms";
import type { Assignee } from "@/lib/queries";
import { ActionForm, SubmitButton } from "./form-controls";
import { PhotoInput } from "./photo-input";
import { ButtonLink, Card, Field, inputClass } from "./ui";

export function WorkOrderForm({
  action,
  assignees,
  defaults,
  todayDate,
  cancelHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  assignees: Assignee[];
  defaults?: WorkOrder;
  todayDate: string;
  cancelHref: string;
}) {
  const editing = !!defaults;
  return (
    <ActionForm action={action} className="space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Issue details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date reported" htmlFor="reportedDate" required>
            <input id="reportedDate" name="reportedDate" type="date" required defaultValue={defaults?.reportedDate ?? todayDate} max={todayDate} className={inputClass} />
          </Field>
          <Field label="Reported by (teacher / staff)" htmlFor="reportedBy" required>
            <input id="reportedBy" name="reportedBy" required defaultValue={defaults?.reportedBy} placeholder="e.g. Ms. Perera" className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Type of work" htmlFor="type" required>
            <select id="type" name="type" required defaultValue={defaults?.type ?? ""} className={inputClass}>
              <option value="" disabled>Select type…</option>
              {WORK_TYPES.map((t) => (
                <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority" htmlFor="priority">
            <select id="priority" name="priority" defaultValue={defaults?.priority ?? "normal"} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Building" htmlFor="building" required>
            <select id="building" name="building" required defaultValue={defaults?.building ?? ""} className={inputClass}>
              <option value="" disabled>Select building…</option>
              {BUILDINGS.map((b) => (
                <option key={b} value={b}>{BUILDING_LABELS[b]}</option>
              ))}
            </select>
          </Field>
          <Field label="Classroom / area" htmlFor="classroom">
            <input id="classroom" name="classroom" defaultValue={defaults?.classroom ?? ""} placeholder="e.g. Room 12, Science Lab" className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Work description" htmlFor="description" required className="sm:col-span-2">
            <textarea id="description" name="description" required rows={4} defaultValue={defaults?.description} placeholder="What is wrong and what needs to be done?" className={inputClass} />
          </Field>
          {!editing && (
            <Field label="Photos of the issue (optional)" htmlFor="photos-picker" className="sm:col-span-2">
              <PhotoInput label="Add photo" />
            </Field>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Assignment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {!editing && (
            <Field label="Assign to" htmlFor="assignedToId" hint="Leave empty to assign later.">
              <select id="assignedToId" name="assignedToId" defaultValue="" className={inputClass}>
                <option value="">Not assigned yet</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName}
                    {a.jobTitle ? ` — ${a.jobTitle}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Due date" htmlFor="dueDate" hint="Used for on-time KPIs.">
            <input id="dueDate" name="dueDate" type="date" defaultValue={defaults?.dueDate ?? ""} min={editing ? undefined : todayDate} className={inputClass} />
          </Field>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">Cancel</ButtonLink>
        <SubmitButton pendingText={editing ? "Saving…" : "Creating…"}>{editing ? "Save changes" : "Create work order"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
