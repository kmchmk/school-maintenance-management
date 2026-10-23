import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/form-controls";
import { btn, cn, PageHeader } from "@/components/ui";
import { ScheduleForm } from "@/components/schedule-form";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { ASSIGNER_ROLES } from "@/lib/constants";
import { today } from "@/lib/dates";
import { listAssignees } from "@/lib/queries";
import { deleteSchedule, updateSchedule } from "../actions";

export const metadata = { title: "Edit schedule" };

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile(ASSIGNER_ROLES);
  const id = Number((await params).id);
  const [schedule] = Number.isInteger(id) ? await db.select().from(schedules).where(eq(schedules.id, id)) : [];
  if (!schedule) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit preventive schedule" />
      <ScheduleForm action={updateSchedule.bind(null, id)} assignees={await listAssignees()} schedule={schedule} todayDate={today()} />
      <form action={deleteSchedule.bind(null, id)} className="mt-6">
        <ConfirmButton message="Delete this schedule? Work orders it already created are kept." className={cn(btn.base, btn.ghost, "text-red-600 hover:bg-red-50")}>
          <Trash2 className="size-4" /> Delete schedule
        </ConfirmButton>
      </form>
    </div>
  );
}
