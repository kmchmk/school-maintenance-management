import { ArrowLeft, CheckCircle2, Pencil, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/form-controls";
import { PhotoInput } from "@/components/photo-input";
import { Alert, btn, ButtonLink, Card, cn, Field, inputClass, PriorityText, StatusBadge } from "@/components/ui";
import { canAssign, canCreate, isManager, requireProfile } from "@/lib/auth";
import { BUILDING_LABELS, WORK_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, today, workOrderRef } from "@/lib/dates";
import { getWorkOrderDetail, listAssignees } from "@/lib/queries";
import {
  addComment,
  assignWorkOrder,
  closeWorkOrder,
  completeWorkOrder,
  deleteWorkOrder,
  reopenWorkOrder,
  startWorkOrder,
} from "../actions";

const DONE_MESSAGES: Record<string, string> = {
  created: "Work order created.",
  assigned: "Assigned. It now shows on their dashboard.",
  started: "Work started.",
  completed: "Marked as completed. The Maintenance Manager has been notified.",
  closed: "Work order closed.",
  reopened: "Work order reopened and sent back to the assignee.",
};

const EVENT_LABELS = {
  created: "created the work order",
  updated: "updated the details",
  assigned: "assigned the work",
  started: "started work",
  completed: "marked it completed",
  closed: "closed the work order",
  reopened: "reopened the work order",
  comment: "commented",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: workOrderRef(Number((await params).id) || 0) };
}

export default async function WorkOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; done?: string }>;
}) {
  const me = await requireProfile();
  const id = Number((await params).id);
  const detail = Number.isInteger(id) ? await getWorkOrderDetail(id) : null;
  if (!detail) notFound();
  const { wo } = detail;
  const manager = isManager(me.role);
  const isAssignee = wo.assignedToId === me.id;
  if (!manager && !isAssignee) notFound();

  const { created, done } = await searchParams;
  const doneMessage = DONE_MESSAGES[created ? "created" : (done ?? "")];
  const assigner = canAssign(me.role);
  const canWork = assigner || isAssignee;
  const workable = wo.status === "assigned" || wo.status === "in_progress";
  const overdue = !!wo.dueDate && wo.dueDate < today() && ["open", "assigned", "in_progress"].includes(wo.status);
  const assignees = assigner && wo.status !== "completed" && wo.status !== "closed" ? await listAssignees() : [];
  const reportPhotos = detail.photos.filter((p) => p.kind === "report");
  const completionPhotos = detail.photos.filter((p) => p.kind === "completion");

  const facts: [string, React.ReactNode][] = [
    ["Type", WORK_TYPE_LABELS[wo.type]],
    ["Building", BUILDING_LABELS[wo.building]],
    ["Classroom / area", wo.classroom || "—"],
    ["Priority", <PriorityText key="p" priority={wo.priority} />],
    ["Reported by", wo.reportedBy],
    ["Date reported", formatDate(wo.reportedDate)],
    ["Assigned to", detail.assigneeName ?? "Not assigned"],
    ["Due date", <span key="d" className={cn(overdue && "font-semibold text-red-600")}>{formatDate(wo.dueDate)}{overdue && " (overdue)"}</span>],
    ["Completed", formatDateTime(wo.completedAt)],
    ["Closed", wo.closedAt ? `${formatDateTime(wo.closedAt)}${detail.closerName ? ` by ${detail.closerName}` : ""}` : "—"],
    ["Recorded by", detail.creatorName ?? (wo.scheduleId ? "Preventive schedule" : "—")],
    ...(wo.reopenCount ? ([["Reopened", `${wo.reopenCount} time${wo.reopenCount > 1 ? "s" : ""}`]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/work-orders" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Work orders
      </Link>

      {doneMessage && <div className="mb-4"><Alert tone="success">{doneMessage}</Alert></div>}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">{workOrderRef(wo.id)}</span>
            <StatusBadge status={wo.status} />
            {wo.scheduleId && <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-200">Preventive</span>}
          </div>
          <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
            {WORK_TYPE_LABELS[wo.type]} · {BUILDING_LABELS[wo.building]}
            {wo.classroom ? ` · ${wo.classroom}` : ""}
          </h1>
        </div>
        {canCreate(me.role) && (
          <ButtonLink href={`/work-orders/${wo.id}/edit`} variant="secondary" className="self-start">
            <Pencil className="size-4" /> Edit
          </ButtonLink>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="lg:col-start-3 lg:row-start-1">
          <Card className="p-4 sm:p-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-1">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

        </div>

        <div className="space-y-6 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Work description</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-900">{wo.description}</p>
            {reportPhotos.length > 0 && <PhotoGrid title="Issue photos" photos={reportPhotos} />}
          </Card>

          {(wo.completedAt || completionPhotos.length > 0) && (
            <Card className="p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-600" /> Completion
              </h2>
              {wo.completionNotes && <p className="mt-2 whitespace-pre-wrap text-slate-900">{wo.completionNotes}</p>}
              {completionPhotos.length > 0 && <PhotoGrid title="Proof photos" photos={completionPhotos} />}
            </Card>
          )}

          {/* Actions */}
          {canWork && wo.status === "assigned" && (
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <p className="text-sm text-slate-700">{isAssignee ? "Ready to start? Let the team know you're on it." : "Mark this job as started."}</p>
              <form action={startWorkOrder.bind(null, wo.id)}>
                <SubmitButton pendingText="Starting…" variant="secondary" className="w-full sm:w-auto">
                  <Play className="size-4" /> Start work
                </SubmitButton>
              </form>
            </Card>
          )}

          {canWork && workable && (
            <Card className="p-4 sm:p-6">
              <h2 className="font-semibold text-slate-900">Complete this work order</h2>
              <ActionForm action={completeWorkOrder.bind(null, wo.id)} className="mt-4 space-y-4">
                <Field label="Photos (optional)" htmlFor="photos-picker">
                  <PhotoInput label="Take / add photo" />
                </Field>
                <Field label="What was done?" htmlFor="notes">
                  <textarea id="notes" name="notes" rows={3} placeholder="e.g. Replaced the faulty breaker and tested the sockets." className={inputClass} />
                </Field>
                <SubmitButton pendingText="Uploading…" variant="success" className="w-full sm:w-auto">
                  <CheckCircle2 className="size-4" /> Mark as completed
                </SubmitButton>
              </ActionForm>
            </Card>
          )}

          {assigner && wo.status === "completed" && (
            <Card className="p-4 sm:p-6">
              <h2 className="font-semibold text-slate-900">Review and close</h2>
              <p className="mt-1 text-sm text-slate-600">Check the work (and any photos), then close the work order or send it back.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ActionForm action={closeWorkOrder.bind(null, wo.id)} className="space-y-3">
                  <Field label="Closing note (optional)" htmlFor="close-note">
                    <textarea id="close-note" name="note" rows={2} className={inputClass} />
                  </Field>
                  <SubmitButton pendingText="Closing…" className="w-full">Close work order</SubmitButton>
                </ActionForm>
                <ReopenForm id={wo.id} />
              </div>
            </Card>
          )}

          {assigner && wo.status === "closed" && (
            <Card className="p-4 sm:p-6">
              <ReopenForm id={wo.id} />
            </Card>
          )}

          <Card className="p-4 sm:p-6">
            <h2 className="font-semibold text-slate-900">Activity</h2>
            <ActionForm action={addComment.bind(null, wo.id)} className="mt-4 space-y-3" resetOnSuccess>
              <label htmlFor="comment" className="sr-only">Add a comment</label>
              <textarea id="comment" name="note" rows={2} placeholder="Add a comment or update…" className={inputClass} />
              <SubmitButton pendingText="Posting…" variant="secondary">Post comment</SubmitButton>
            </ActionForm>
            <ol className="mt-6 space-y-4 border-l-2 border-slate-200 pl-4">
              {detail.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{e.actorName ?? "System"}</span> {EVENT_LABELS[e.type]}
                  </p>
                  {e.note && <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{e.note}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6 lg:col-start-3 lg:row-start-2">
          {assignees.length > 0 && (
            <Card className="p-4 sm:p-6">
              <h2 className="font-semibold text-slate-900">{wo.assignedToId ? "Reassign" : "Assign"}</h2>
              <ActionForm action={assignWorkOrder.bind(null, wo.id)} className="mt-3 space-y-3">
                <Field label="Assign to" htmlFor="assign-to">
                  <select id="assign-to" name="assignedToId" defaultValue={wo.assignedToId ?? ""} required className={inputClass}>
                    <option value="" disabled>Choose a person…</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                        {a.jobTitle ? ` — ${a.jobTitle}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Due date" htmlFor="assign-due">
                  <input id="assign-due" name="dueDate" type="date" defaultValue={wo.dueDate ?? ""} className={inputClass} />
                </Field>
                <SubmitButton pendingText="Assigning…" className="w-full">{wo.assignedToId ? "Reassign" : "Assign"}</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {assigner && (
            <form action={deleteWorkOrder.bind(null, wo.id)}>
              <ConfirmButton message={`Delete ${workOrderRef(wo.id)} permanently? This cannot be undone.`} className={cn(btn.base, btn.ghost, "w-full text-red-600 hover:bg-red-50")}>
                <Trash2 className="size-4" /> Delete work order
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ReopenForm({ id }: { id: number }) {
  return (
    <ActionForm action={reopenWorkOrder.bind(null, id)} className="space-y-3">
      <Field label="Reason for reopening" htmlFor="reopen-note" required>
        <textarea id="reopen-note" name="note" rows={2} required placeholder="What still needs to be done?" className={inputClass} />
      </Field>
      <SubmitButton pendingText="Reopening…" variant="secondary" className="w-full">Reopen</SubmitButton>
    </ActionForm>
  );
}

function PhotoGrid({ title, photos }: { title: string; photos: { id: number }[] }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-xs font-medium text-slate-500">{title}</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <a key={p.id} href={`/api/photos/${p.id}`} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${p.id}`} alt={`${title} ${i + 1}`} loading="lazy" className="size-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}
