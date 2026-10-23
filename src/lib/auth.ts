import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { ASSIGNER_ROLES, USER_ADMIN_ROLES, WORK_ROLES, type Role } from "./constants";

/** Sees all work orders and can raise them. */
export const isManager = (role: Role) => WORK_ROLES.includes(role);
/** Assigns, closes, reopens and deletes work (the maintenance manager). */
export const canAssign = (role: Role) => ASSIGNER_ROLES.includes(role);
export const canManageUsers = (role: Role) => USER_ADMIN_ROLES.includes(role);

function displayName(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return user.fullName?.trim() || user.username || user.primaryEmailAddress?.emailAddress || "User";
}

/**
 * Returns the signed-in user's profile, creating it on first sign-in.
 * The very first person to sign in becomes an admin; everyone after that
 * waits as "pending" until an admin grants them a role.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId));
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  const [anyAdmin] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(inArray(profiles.role, USER_ADMIN_ROLES), eq(profiles.active, true), ne(profiles.id, userId)))
    .limit(1);

  const [created] = await db
    .insert(profiles)
    .values({
      id: userId,
      username: user.username,
      fullName: displayName(user),
      email: user.primaryEmailAddress?.emailAddress ?? null,
      role: anyAdmin ? "pending" : "admin",
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId));
  return row ?? null;
});

/** For pages and actions: requires an active, approved user (optionally with one of `roles`). */
export async function requireProfile(roles?: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.active || profile.role === "pending") redirect("/pending");
  if (roles && !roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}
