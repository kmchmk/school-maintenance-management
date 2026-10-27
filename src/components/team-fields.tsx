import type { Assignee } from "@/lib/queries";
import { Field, inputClass } from "./ui";

/** Lead person plus optional extra people for a job. Extra people get the same access as the lead. */
export function TeamFields({
  assignees,
  leadId,
  helperIds = [],
  required = false,
  idPrefix = "team",
}: {
  assignees: Assignee[];
  leadId?: string | null;
  helperIds?: string[];
  required?: boolean;
  idPrefix?: string;
}) {
  return (
    <>
      <Field label={required ? "Lead person" : "Assign to"} htmlFor={`${idPrefix}-lead`} hint={required ? undefined : "Leave empty to assign later."}>
        <select id={`${idPrefix}-lead`} name="assignedToId" defaultValue={leadId ?? ""} required={required} className={inputClass}>
          <option value="" disabled={required}>{required ? "Choose a person…" : "Not assigned yet"}</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
              {a.jobTitle ? ` — ${a.jobTitle}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <details open={helperIds.length > 0} className="rounded-lg border border-slate-200 sm:col-span-2">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-slate-800">
          More people on this job <span className="font-normal text-slate-500">(optional)</span>
        </summary>
        <div className="border-t border-slate-200 px-3 py-2">
          <p className="mb-2 text-xs text-slate-500">For bigger jobs. Everyone ticked here gets the job too and can work on it.</p>
          <div className="grid max-h-64 gap-1 overflow-y-auto">
            {assignees.map((a) => (
              <label key={a.id} className="flex min-h-11 items-center gap-3 rounded-md px-1 hover:bg-slate-50">
                <input type="checkbox" name="helperIds" value={a.id} defaultChecked={helperIds.includes(a.id)} className="size-5 shrink-0 rounded border-slate-300" />
                <span className="text-sm text-slate-800">
                  {a.fullName}
                  {a.jobTitle && <span className="text-slate-500"> — {a.jobTitle}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </>
  );
}
