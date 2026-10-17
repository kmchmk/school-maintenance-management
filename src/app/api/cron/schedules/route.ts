import { generateDueWorkOrders } from "@/lib/schedules";

export const dynamic = "force-dynamic";

// Called daily by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const created = await generateDueWorkOrders();
  return Response.json({ created });
}
