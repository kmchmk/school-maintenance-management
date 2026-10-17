import { CalendarDays, MapPin, User } from "lucide-react";
import Link from "next/link";
import { BUILDING_LABELS, WORK_TYPE_LABELS } from "@/lib/constants";
import { formatDate, today, workOrderRef } from "@/lib/dates";
import type { WorkOrderRow } from "@/lib/queries";
import { cn, PriorityText, StatusBadge } from "./ui";

function isOverdue(wo: WorkOrderRow) {
  return !!wo.dueDate && wo.dueDate < today() && ["open", "assigned", "in_progress"].includes(wo.status);
}

function location(wo: WorkOrderRow) {
  return `${BUILDING_LABELS[wo.building]}${wo.classroom ? ` · ${wo.classroom}` : ""}`;
}

export function WorkOrderList({ rows }: { rows: WorkOrderRow[] }) {
  return (
    <>
      {/* Phones: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((wo) => (
          <li key={wo.id}>
            <Link
              href={`/work-orders/${wo.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {workOrderRef(wo.id)} · {WORK_TYPE_LABELS[wo.type]}
                </span>
                <StatusBadge status={wo.status} />
              </div>
              <p className="mt-2 line-clamp-2 font-medium text-slate-900">{wo.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {location(wo)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="size-3.5" />
                  {wo.assigneeName ?? "Unassigned"}
                </span>
                <span className={cn("flex items-center gap-1", isOverdue(wo) && "font-semibold text-red-600")}>
                  <CalendarDays className="size-3.5" />
                  {wo.dueDate ? `Due ${formatDate(wo.dueDate)}` : formatDate(wo.reportedDate)}
                </span>
                {wo.priority !== "normal" && <PriorityText priority={wo.priority} />}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablets and desktops: table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Work</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Assigned to</th>
              <th className="px-4 py-3 font-medium">Reported</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((wo) => (
              <tr key={wo.id} className="group relative hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">
                  <Link href={`/work-orders/${wo.id}`} className="after:absolute after:inset-0">
                    {workOrderRef(wo.id)}
                  </Link>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium text-slate-900 group-hover:text-brand-700">{wo.description}</p>
                  <p className="text-xs text-slate-500">
                    {WORK_TYPE_LABELS[wo.type]}
                    {wo.priority !== "normal" && (
                      <>
                        {" · "}
                        <PriorityText priority={wo.priority} />
                      </>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">{location(wo)}</td>
                <td className="px-4 py-3 text-slate-600">{wo.assigneeName ?? <span className="text-slate-400">Unassigned</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(wo.reportedDate)}</td>
                <td className={cn("whitespace-nowrap px-4 py-3", isOverdue(wo) ? "font-semibold text-red-600" : "text-slate-600")}>
                  {formatDate(wo.dueDate)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={wo.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
