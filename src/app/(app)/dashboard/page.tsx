import { and, count, gte, sql, type SQL } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, ClipboardList, Hourglass, Inbox, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Alert, ButtonLink, Card, cn, EmptyState, PageHeader } from "@/components/ui";
import { WorkOrderList } from "@/components/work-order-list";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { canAssign, canCreate, isManager, requireProfile } from "@/lib/auth";
import { today } from "@/lib/dates";
import { listWorkOrders, onTeamCondition, overdueCondition } from "@/lib/queries";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, icon: Icon, href, tone }: { label: string; value: number; icon: LucideIcon; href: string; tone: string }) {
  return (
    <Link href={href} className="block">
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-xs leading-snug text-slate-600">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const me = await requireProfile();
  const manager = isManager(me.role);
  const scope: SQL | undefined = manager ? undefined : onTeamCondition(me.id);
  const monthStart = today().slice(0, 8) + "01";

  const [byStatus, [overdue], [closedThisMonth]] = await Promise.all([
    db.select({ status: workOrders.status, n: count() }).from(workOrders).where(scope).groupBy(workOrders.status),
    db.select({ n: count() }).from(workOrders).where(and(scope, overdueCondition())),
    db
      .select({ n: count() })
      .from(workOrders)
      .where(and(scope, sql`${workOrders.completedAt} is not null`, gte(workOrders.completedAt, new Date(`${monthStart}T00:00:00+05:30`)))),
  ]);
  const n = (s: string) => byStatus.find((r) => r.status === s)?.n ?? 0;

  const firstName = me.fullName.split(" ")[0];

  if (!manager) {
    const mine = await listWorkOrders(me, { status: "active" }, 50);
    const todo = mine.filter((w) => w.status !== "completed");
    return (
      <>
        <PageHeader title={`Hi ${firstName}`} description="Here's the work assigned to you." />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="To start" value={n("assigned")} icon={Inbox} href="/work-orders?status=assigned" tone="bg-blue-50 text-blue-700" />
          <Stat label="In progress" value={n("in_progress")} icon={Hourglass} href="/work-orders?status=in_progress" tone="bg-amber-50 text-amber-700" />
          <Stat label="Overdue" value={overdue.n} icon={AlertTriangle} href="/work-orders?status=overdue" tone="bg-red-50 text-red-700" />
          <Stat label="Completed this month" value={closedThisMonth.n} icon={CheckCircle2} href="/work-orders?status=all" tone="bg-emerald-50 text-emerald-700" />
        </div>
        <h2 className="mb-3 font-semibold text-slate-900">My open work</h2>
        {todo.length ? <WorkOrderList rows={todo} /> : <EmptyState title="You're all caught up">No open work orders are assigned to you.</EmptyState>}
      </>
    );
  }

  const [needsClosure, unassigned] = await Promise.all([
    canAssign(me.role) ? listWorkOrders(me, { status: "completed" }, 10) : Promise.resolve([]),
    listWorkOrders(me, { status: "open" }, 10),
  ]);

  return (
    <>
      <PageHeader
        title={`Hi ${firstName}`}
        description="Overview of maintenance work across the school."
        actions={
          canCreate(me.role) && (
            <ButtonLink href="/work-orders/new">
              <Plus className="size-4" /> New work order
            </ButtonLink>
          )
        }
      />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Stat label="Unassigned" value={n("open")} icon={Inbox} href="/work-orders?status=open" tone="bg-slate-100 text-slate-700" />
        <Stat label="Assigned / in progress" value={n("assigned") + n("in_progress")} icon={ClipboardList} href="/work-orders?status=active" tone="bg-blue-50 text-blue-700" />
        <Stat label="Awaiting closure" value={n("completed")} icon={Hourglass} href="/work-orders?status=completed" tone="bg-violet-50 text-violet-700" />
        <Stat label="Overdue" value={overdue.n} icon={AlertTriangle} href="/work-orders?status=overdue" tone="bg-red-50 text-red-700" />
        <Stat label="Completed this month" value={closedThisMonth.n} icon={CheckCircle2} href="/reports" tone="bg-emerald-50 text-emerald-700" />
      </div>

      {canAssign(me.role) && n("open") > 0 && (
        <div className="mb-6">
          <Alert tone="warning">
            <strong>{n("open")}</strong> work order{n("open") === 1 ? " is" : "s are"} waiting to be assigned.{" "}
            <Link href="/work-orders?status=open" className="font-medium underline">
              Assign now
            </Link>
          </Alert>
        </div>
      )}
      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-slate-900">{canAssign(me.role) ? "Waiting to be assigned" : "Unassigned"}</h2>
        {unassigned.length ? <WorkOrderList rows={unassigned} /> : <EmptyState title="Every work order has someone on it" />}
      </section>
      {canAssign(me.role) && (
        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Awaiting your review</h2>
          {needsClosure.length ? <WorkOrderList rows={needsClosure} /> : <EmptyState title="Nothing to review">Completed work will appear here for closing.</EmptyState>}
        </section>
      )}
    </>
  );
}
