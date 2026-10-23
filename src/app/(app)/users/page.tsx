import { asc } from "drizzle-orm";
import { ChevronRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/form-controls";
import { Alert, ButtonLink, Card, cn, inputClass, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { USER_ADMIN_ROLES } from "@/lib/constants";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { approveUser } from "./actions";

export const metadata = { title: "Users" };

const ROLE_ORDER = { manager: 0, admin: 1, supervisor: 2, staff: 3, pending: 4 } as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireProfile(USER_ADMIN_ROLES);
  const { created } = await searchParams;
  const all = (await db.select().from(profiles).orderBy(asc(profiles.fullName))).sort(
    (a, b) => Number(!a.active) - Number(!b.active) || ROLE_ORDER[a.role] - ROLE_ORDER[b.role],
  );
  const pending = all.filter((p) => p.role === "pending" && p.active);
  const others = all.filter((p) => !(p.role === "pending" && p.active));

  return (
    <>
      <PageHeader
        title="Users"
        description={`${all.filter((p) => p.active).length} active accounts`}
        actions={
          <ButtonLink href="/users/new">
            <UserPlus className="size-4" /> Add user
          </ButtonLink>
        }
      />
      {created && <div className="mb-4"><Alert tone="success">Account <strong>{created}</strong> created. Share the username and password with them.</Alert></div>}

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-semibold text-slate-900">Waiting for approval</h2>
          <div className="space-y-3">
            {pending.map((p) => (
              <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{p.fullName}</p>
                  <p className="text-sm text-slate-500">{p.username ? `@${p.username}` : p.email}</p>
                </div>
                <form action={approveUser.bind(null, p.id)} className="flex gap-2">
                  <select name="role" defaultValue="staff" aria-label={`Role for ${p.fullName}`} className={cn(inputClass, "py-2")}>
                    {ROLES.filter((r) => r !== "pending").map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <SubmitButton pendingText="…" className="py-2">Approve</SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card className="divide-y divide-slate-100">
        {others.map((p) => (
          <Link key={p.id} href={`/users/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {p.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-medium", p.active ? "text-slate-900" : "text-slate-400 line-through")}>{p.fullName}</p>
              <p className="truncate text-sm text-slate-500">
                {p.username ? `@${p.username}` : (p.email ?? "—")}
                {p.jobTitle ? ` · ${p.jobTitle}` : ""}
              </p>
            </div>
            <span className="hidden text-sm text-slate-600 sm:block">{p.active ? ROLE_LABELS[p.role] : "Deactivated"}</span>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>
        ))}
      </Card>
    </>
  );
}
