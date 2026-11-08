"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
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
import { btn, ButtonLink, Card, cn, Field, inputClass } from "./ui";

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
  const [frequency, setFrequency] = useState<string>(schedule?.frequency ?? "monthly");
  // Custom dates are stored as "MM-DD"; show them as dates in the current year.
  const year = todayDate.slice(0, 4);
  const [dates, setDates] = useState<string[]>(
    schedule?.customDates.length ? schedule.customDates.map((md) => `${year}-${md}`) : [""],
  );
  const custom = frequency === "custom";
  return (
    <ActionForm action={action} className="space-y-6">
      <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <Field label="Maintenance task" htmlFor="description" required className="sm:col-span-2">
          <textarea id="description" name="description" required rows={2} defaultValue={schedule?.description} placeholder="e.g. Inspect and service all fire extinguishers" className={inputClass} />
        </Field>
        <Field label="Additional details" htmlFor="details" hint="Optional. Checklist, parts, contractor or anything else the technician should know. Added to each work order." className="sm:col-span-2">
          <textarea id="details" name="details" rows={3} defaultValue={schedule?.details ?? ""} placeholder="e.g. Check pressure gauge, safety pin and seal. Replace tags. Record serial numbers." className={inputClass} />
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
          <select id="frequency" name="frequency" required value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
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
        {custom ? (
          <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
            <p className="text-sm font-medium text-slate-700">
              Dates in the year <span className="text-red-600">*</span>
            </p>
            <p className="mb-2 text-xs text-slate-500">A work order is created on each of these dates, every year.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {dates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="date"
                    name="customDates"
                    aria-label={`Date ${i + 1}`}
                    value={d}
                    required={i === 0}
                    onChange={(e) => setDates(dates.map((x, j) => (j === i ? e.target.value : x)))}
                    className={inputClass}
                  />
                  {dates.length > 1 && (
                    <button type="button" aria-label={`Remove date ${i + 1}`} onClick={() => setDates(dates.filter((_, j) => j !== i))} className={cn(btn.base, btn.ghost, "px-3")}>
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDates([...dates, ""])} className={cn(btn.base, btn.ghost, "mt-2 px-2 text-brand-700")}>
              <Plus className="size-4" /> Add another date
            </button>
          </div>
        ) : (
          <Field label={schedule ? "Next due date" : "First due date"} htmlFor="nextDueDate" required>
            <input id="nextDueDate" name="nextDueDate" type="date" required defaultValue={schedule?.nextDueDate ?? todayDate} className={inputClass} />
          </Field>
        )}
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
