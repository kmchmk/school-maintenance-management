import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { WorkOrderForm } from "@/components/work-order-form";
import { canAssign, requireProfile } from "@/lib/auth";
import { CREATOR_ROLES } from "@/lib/constants";
import { today, workOrderRef } from "@/lib/dates";
import { getWorkOrderDetail } from "@/lib/queries";
import { updateWorkOrder } from "../../actions";

export const metadata = { title: "Edit work order" };

export default async function EditWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireProfile(CREATOR_ROLES);
  const id = Number((await params).id);
  const detail = Number.isInteger(id) ? await getWorkOrderDetail(id) : null;
  if (!detail) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${workOrderRef(id)}`} />
      <WorkOrderForm action={updateWorkOrder.bind(null, id)} assignees={[]} defaults={detail.wo} todayDate={today()} cancelHref={`/work-orders/${id}`} canAssign={canAssign(me.role)} />
    </div>
  );
}
