import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workOrderPhotos, workOrders } from "@/db/schema";
import { getProfile, isManager } from "@/lib/auth";
import { isOnTeam } from "@/lib/queries";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile || !profile.active || profile.role === "pending") return new Response("Unauthorized", { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });

  const [photo] = await db
    .select({ data: workOrderPhotos.data, contentType: workOrderPhotos.contentType, workOrderId: workOrders.id, assignedToId: workOrders.assignedToId })
    .from(workOrderPhotos)
    .innerJoin(workOrders, eq(workOrders.id, workOrderPhotos.workOrderId))
    .where(eq(workOrderPhotos.id, id));
  if (!photo || (!isManager(profile.role) && !(await isOnTeam(photo.workOrderId, photo.assignedToId, profile.id)))) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
