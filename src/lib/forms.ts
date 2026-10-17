export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function optStr(formData: FormData, key: string): string | null {
  return str(formData, key) || null;
}

export function oneOf<T extends string>(formData: FormData, key: string, values: readonly T[], fallback?: T): T {
  const v = str(formData, key) as T;
  if (values.includes(v)) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Invalid ${key}`);
}

export function optDate(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export type ActionState = { error?: string; ok?: string } | undefined;
