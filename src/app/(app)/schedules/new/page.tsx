import { PageHeader } from "@/components/ui";
import { ScheduleForm } from "@/components/schedule-form";
import { requireProfile } from "@/lib/auth";
import { today } from "@/lib/dates";
import { listAssignees } from "@/lib/queries";
import { createSchedule } from "../actions";

export const metadata = { title: "New schedule" };

export default async function NewSchedulePage() {
  await requireProfile(["admin", "supervisor"]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New preventive schedule" />
      <ScheduleForm action={createSchedule} assignees={await listAssignees()} todayDate={today()} />
    </div>
  );
}
