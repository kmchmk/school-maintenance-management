import { Download } from "lucide-react";
import { btn, Card, cn, inputClass, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { WORK_ROLES } from "@/lib/constants";
import { BUILDING_LABELS, WORK_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatHours } from "@/lib/dates";
import { parseRange, reportRows, summarize } from "@/lib/reports";

export const metadata = { title: "Reports" };

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

function Bars({ title, items, labels }: { title: string; items: { key: string; total: number; open: number }[]; labels: Record<string, string> }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-700">{labels[i.key]}</span>
              <span className="tabular-nums text-slate-900">
                {i.total}
                {i.open > 0 && <span className="text-slate-500"> ({i.open} open)</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(i.total / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireProfile(WORK_ROLES);
  const range = parseRange(await searchParams);
  const s = summarize(await reportRows(range.from, range.to));

  const tiles: [string, string | number][] = [
    ["Work orders", s.total],
    ["Completed", s.completed],
    ["Closed", s.closed],
    ["Still open", s.open],
    ["Overdue", s.overdue],
    ["Avg. time to complete", formatHours(s.avgResolutionHours)],
  ];

  return (
    <>
      <PageHeader title="Reports & KPIs" description={`Work reported ${formatDate(range.from)} – ${formatDate(range.to)}`} />

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">From</span>
          <input type="date" name="from" defaultValue={range.from} className={cn(inputClass, "py-2")} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">To</span>
          <input type="date" name="to" defaultValue={range.to} className={cn(inputClass, "py-2")} />
        </label>
        <button className={cn(btn.base, btn.secondary, "py-2")}>Update</button>
        <a href={`/api/reports/export?from=${range.from}&to=${range.to}`} className={cn(btn.base, btn.ghost, "py-2")}>
          <Download className="size-4" /> Export CSV
        </a>
      </form>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-slate-600">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="p-4 sm:px-6">
          <h2 className="font-semibold text-slate-900">Technician KPIs</h2>
          <p className="mt-1 text-xs text-slate-500">
            Response = assigned → started. Resolution = assigned → completed. On time = completed on or before the due date.
          </p>
        </div>
        {s.technicians.length === 0 ? (
          <p className="px-4 pb-6 text-sm text-slate-500 sm:px-6">No assigned work in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">Technician</th>
                  <th className="px-3 py-3 text-right font-medium">Assigned</th>
                  <th className="px-3 py-3 text-right font-medium">Completed</th>
                  <th className="px-3 py-3 text-right font-medium">Completion</th>
                  <th className="px-3 py-3 text-right font-medium">Open</th>
                  <th className="px-3 py-3 text-right font-medium">Overdue</th>
                  <th className="px-3 py-3 text-right font-medium">Avg response</th>
                  <th className="px-3 py-3 text-right font-medium">Avg resolution</th>
                  <th className="px-3 py-3 text-right font-medium">On time</th>
                  <th className="px-3 py-3 text-right font-medium sm:pr-6">Reopened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {s.technicians.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 sm:px-6">
                      <p className="font-medium text-slate-900">{t.name}</p>
                      {t.title && <p className="text-xs text-slate-500">{t.title}</p>}
                    </td>
                    <td className="px-3 py-3 text-right">{t.assigned}</td>
                    <td className="px-3 py-3 text-right">{t.completed}</td>
                    <td className="px-3 py-3 text-right">{pct(t.completionRate)}</td>
                    <td className="px-3 py-3 text-right">{t.open}</td>
                    <td className={cn("px-3 py-3 text-right", t.overdue > 0 && "font-semibold text-red-600")}>{t.overdue}</td>
                    <td className="px-3 py-3 text-right">{formatHours(t.avgResponseHours)}</td>
                    <td className="px-3 py-3 text-right">{formatHours(t.avgResolutionHours)}</td>
                    <td className="px-3 py-3 text-right">{pct(t.onTimeRate)}</td>
                    <td className="px-3 py-3 text-right sm:pr-6">{t.reopened}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Bars title="By type of work" items={s.byType} labels={WORK_TYPE_LABELS} />
        <Bars title="By building" items={s.byBuilding} labels={BUILDING_LABELS} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        {s.preventive} preventive · {s.unassigned} unassigned in this period.
      </p>
    </>
  );
}
