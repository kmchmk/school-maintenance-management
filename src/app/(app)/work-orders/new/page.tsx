import { PageHeader } from "@/components/ui";
import { WorkOrderForm } from "@/components/work-order-form";
import { canAssign, requireProfile } from "@/lib/auth";
import { WORK_ROLES } from "@/lib/constants";
import { today } from "@/lib/dates";
import { listAssignees } from "@/lib/queries";
import { createWorkOrder } from "../actions";

export const metadata = { title: "New work order" };

export default async function NewWorkOrderPage() {
  const me = await requireProfile(WORK_ROLES);
  const assignees = canAssign(me.role) ? await listAssignees() : [];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New work order" description="Record an issue reported by a teacher or staff member." />
      <WorkOrderForm action={createWorkOrder} assignees={assignees} todayDate={today()} cancelHref="/work-orders" canAssign={canAssign(me.role)} />
    </div>
  );
}
