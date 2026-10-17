import "server-only";
import { db } from "@/db";
import { workOrderPhotos } from "@/db/schema";
import { MAX_PHOTOS } from "./constants";

const MAX_BYTES = 3 * 1024 * 1024;

export function photoFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);
}

export function validatePhotos(files: File[]): string | null {
  for (const f of files) {
    if (!f.type.startsWith("image/")) return "Only image files can be attached.";
    if (f.size > MAX_BYTES) return "Each photo must be smaller than 3 MB.";
  }
  return null;
}

export async function savePhotos(
  workOrderId: number,
  kind: "report" | "completion",
  files: File[],
  uploadedById: string,
) {
  if (files.length === 0) return;
  const rows = await Promise.all(
    files.map(async (f) => ({
      workOrderId,
      kind,
      contentType: f.type,
      data: Buffer.from(await f.arrayBuffer()),
      uploadedById,
    })),
  );
  await db.insert(workOrderPhotos).values(rows);
}
