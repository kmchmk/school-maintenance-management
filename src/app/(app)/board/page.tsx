import Link from "next/link";
import { Card, cn, EmptyState, PageHeader, PriorityText, StatusBadge } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { BUILDING_LABELS, WORK_TYPE_LABELS } from "@/lib/constants";
import { formatDate, today, workOrderRef } from "@/lib/dates";
import { listWorkOrders, type WorkOrderRow } from "@/lib/queries";

export const metadata = { title: "Board" };

type Section = { key: string; name: string; title: string | null; rows: WorkOrderRow[] };

/** All work that isn't closed yet, grouped into one table per person. Closed work drops off automatically. */
export default async function BoardPage() {
  const me = await requireProfile(["admin", "supervisor"]);
  const rows = await listWorkOrders(me, { status: "active" }, 1000);
  const now = today();

  const sections = new Map<string, Section>();
  for (const wo of rows) {
    const key = wo.assignedToId ?? "unassigned";
    if (!sections.has(key)) {
      sections.set(key, { key, name: wo.assigneeName ?? "Unassigned", title: wo.assigneeName ? wo.assigneeTitle : null, rows: [] });
    }
    sections.get(key)!.rows.push(wo);
  }
  const ordered = [...sections.values()].sort((a, b) =>
    a.key === "unassigned" ? -1 : b.key === "unassigned" ? 1 : a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        title="Board"
        description={`${rows.length} open work order${rows.length === 1 ? "" : "s"}, grouped by person. Closed work orders drop off automatically and stay in Reports.`}
      />
      {ordered.length === 0 ? (
        <EmptyState title="Nothing open">Every work order is closed.</EmptyState>
      ) : (
        <div className="space-y-6">
          {ordered.map((s) => {
            const overdue = s.rows.filter((r) => r.dueDate && r.dueDate < now && r.status !== "completed").length;
            return (
              <Card key={s.key} className="overflow-hidden">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">
                    {s.name}
                    {s.title && <span className="ml-2 text-sm font-normal text-slate-500">{s.title}</span>}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {s.rows.length} open
                    {overdue > 0 && <span className="ml-2 font-semibold text-red-600">{overdue} overdue</span>}
                  </p>
                </div>
                <ul className="divide-y divide-slate-100 md:hidden">
                  {s.rows.map((wo) => {
                    const late = !!wo.dueDate && wo.dueDate < now && wo.status !== "completed";
                    return (
                      <li key={wo.id}>
                        <Link href={`/work-orders/${wo.id}`} className="block px-4 py-3 active:bg-slate-50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                              {workOrderRef(wo.id)} · {WORK_TYPE_LABELS[wo.type]}
                              {wo.priority !== "normal" && (
                                <>
                                  {" · "}
                                  <PriorityText priority={wo.priority} />
                                </>
                              )}
                            </span>
                            <StatusBadge status={wo.status} />
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{wo.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {BUILDING_LABELS[wo.building]}
                            {wo.classroom ? ` · ${wo.classroom}` : ""} · {wo.reportedBy} ·{" "}
                            <span className={cn(late && "font-semibold text-red-600")}>
                              {wo.dueDate ? `Due ${formatDate(wo.dueDate)}` : formatDate(wo.reportedDate)}
                            </span>
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Ref</th>
                        <th className="px-4 py-2 font-medium">Reported</th>
                        <th className="px-4 py-2 font-medium">Reported by</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Location</th>
                        <th className="px-4 py-2 font-medium">Work</th>
                        <th className="px-4 py-2 font-medium">Due</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {s.rows.map((wo) => {
                        const late = !!wo.dueDate && wo.dueDate < now && wo.status !== "completed";
                        return (
                          <tr key={wo.id} className="relative hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-500">
                              <Link href={`/work-orders/${wo.id}`} className="after:absolute after:inset-0">
                                {workOrderRef(wo.id)}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDate(wo.reportedDate)}</td>
                            <td className="px-4 py-2.5 text-slate-600">{wo.reportedBy}</td>
                            <td className="whitespace-nowrap px-4 py-2.5">
                              {WORK_TYPE_LABELS[wo.type]}
                              {wo.priority !== "normal" && (
                                <div>
                                  <PriorityText priority={wo.priority} />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {BUILDING_LABELS[wo.building]}
                              {wo.classroom && <div className="text-xs text-slate-500">{wo.classroom}</div>}
                            </td>
                            <td className="max-w-xs px-4 py-2.5">
                              <p className="line-clamp-2 text-slate-900">{wo.description}</p>
                            </td>
                            <td className={cn("whitespace-nowrap px-4 py-2.5", late ? "font-semibold text-red-600" : "text-slate-600")}>
                              {formatDate(wo.dueDate)}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={wo.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
