import { Plus, Search } from "lucide-react";
import { ButtonLink, EmptyState, inputClass, PageHeader, btn, cn } from "@/components/ui";
import { WorkOrderList } from "@/components/work-order-list";
import { canCreate, isManager, requireProfile } from "@/lib/auth";
import { BUILDING_LABELS, BUILDINGS, STATUS_LABELS, STATUSES, WORK_TYPE_LABELS, WORK_TYPES } from "@/lib/constants";
import { listAssignees, listWorkOrders, type WorkOrderFilters } from "@/lib/queries";

export const metadata = { title: "Work orders" };

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<WorkOrderFilters> }) {
  const me = await requireProfile();
  const filters = await searchParams;
  const manager = isManager(me.role);
  const [rows, assignees] = await Promise.all([listWorkOrders(me, filters), manager ? listAssignees() : []]);
  const filtered = Object.entries(filters).some(([k, v]) => v && !(k === "status" && v === "active"));

  const select = cn(inputClass, "py-2");
  return (
    <>
      <PageHeader
        title={manager ? "Work orders" : "My work orders"}
        description={`${rows.length}${rows.length === 100 ? "+" : ""} shown`}
        actions={
          canCreate(me.role) && (
            <ButtonLink href="/work-orders/new">
              <Plus className="size-4" /> New work order
            </ButtonLink>
          )
        }
      />

      <form className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="search">
        <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={filters.q} placeholder="Search description, room, reporter, WO-…" aria-label="Search" className={cn(inputClass, "py-2 pl-9")} />
        </div>
        <select name="status" defaultValue={filters.status ?? "active"} aria-label="Status" className={select}>
          <option value="active">All open</option>
          <option value="overdue">Overdue</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
          <option value="all">Everything</option>
        </select>
        <select name="type" defaultValue={filters.type ?? ""} aria-label="Type" className={select}>
          <option value="">All types</option>
          {WORK_TYPES.map((t) => (
            <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select name="building" defaultValue={filters.building ?? ""} aria-label="Building" className={select}>
          <option value="">All buildings</option>
          {BUILDINGS.map((b) => (
            <option key={b} value={b}>{BUILDING_LABELS[b]}</option>
          ))}
        </select>
        {manager ? (
          <select name="assignee" defaultValue={filters.assignee ?? ""} aria-label="Assigned to" className={select}>
            <option value="">Anyone</option>
            <option value="me">Me</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>{a.fullName}</option>
            ))}
          </select>
        ) : (
          <span className="hidden lg:block" />
        )}
        <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
          <button className={cn(btn.base, btn.secondary, "py-2")}>Apply filters</button>
          {filtered && (
            <ButtonLink href="/work-orders" variant="ghost" className="py-2">
              Clear
            </ButtonLink>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No work orders found">
          {filtered ? "Try changing the filters." : canCreate(me.role) ? "Create the first work order to get started." : manager ? "No work orders yet." : "Nothing is assigned to you right now."}
        </EmptyState>
      ) : (
        <WorkOrderList rows={rows} />
      )}
    </>
  );
}
