import { asc, eq } from "drizzle-orm";
import { CalendarClock, Plus } from "lucide-react";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/form-controls";
import { ButtonLink, Card, cn, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { profiles, schedules } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { BUILDING_LABELS, FREQUENCY_LABELS, WORK_TYPE_LABELS } from "@/lib/constants";
import { formatDate, today } from "@/lib/dates";
import { runSchedulesNow } from "./actions";

export const metadata = { title: "Preventive maintenance" };

export default async function SchedulesPage() {
  await requireProfile(["admin", "supervisor"]);
  const rows = await db
    .select({ s: schedules, assigneeName: profiles.fullName })
    .from(schedules)
    .leftJoin(profiles, eq(profiles.id, schedules.assignedToId))
    .orderBy(asc(schedules.active), asc(schedules.nextDueDate));
  rows.sort((a, b) => Number(b.s.active) - Number(a.s.active));
  const now = today();

  return (
    <>
      <PageHeader
        title="Preventive maintenance"
        description="Recurring checks create work orders automatically each morning when they fall due."
        actions={
          <ButtonLink href="/schedules/new">
            <Plus className="size-4" /> New schedule
          </ButtonLink>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No schedules yet">Add recurring checks such as monthly fire extinguisher inspections or quarterly HVAC servicing.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(({ s, assigneeName }) => (
            <Link key={s.id} href={`/schedules/${s.id}`} className="block">
              <Card className={cn("h-full p-4 transition-shadow hover:shadow-md", !s.active && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                    <CalendarClock className="size-4" /> {FREQUENCY_LABELS[s.frequency]}
                  </span>
                  {!s.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Paused</span>}
                </div>
                <p className="mt-2 line-clamp-2 font-medium text-slate-900">{s.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {WORK_TYPE_LABELS[s.type]} · {BUILDING_LABELS[s.building]}
                  {s.classroom ? ` · ${s.classroom}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Next due <span className={cn("font-medium", s.active && s.nextDueDate <= now ? "text-red-600" : "text-slate-700")}>{formatDate(s.nextDueDate)}</span>
                  {" · "}
                  {assigneeName ?? "Unassigned"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Card className="mt-6 p-4">
        <ActionForm action={runSchedulesNow} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Work orders are generated automatically every day at 6:00 AM. You can also generate anything that is due right now.</p>
          <SubmitButton variant="secondary" pendingText="Generating…">Generate due work orders</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
