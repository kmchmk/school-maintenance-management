"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, schedules, workOrderEvents, workOrders } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { getSignInSettings } from "@/lib/clerk-settings";
import { ROLES, USER_ADMIN_ROLES } from "@/lib/constants";
import { type ActionState, oneOf, optStr, str } from "@/lib/forms";

function clerkError(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const e = err.errors[0];
    const msg = e?.longMessage || e?.message || "Clerk rejected the request.";
    if (e?.code === "form_param_unknown" && e.meta?.paramName === "username") {
      return "Usernames are not enabled in Clerk. Enable Username under User & authentication in the Clerk dashboard.";
    }
    return msg;
  }
  console.error(err);
  return "Something went wrong. Please try again.";
}

const validEmail = (v: string | null) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(USER_ADMIN_ROLES);
  const settings = await getSignInSettings();
  const fullName = str(formData, "fullName");
  const username = settings.username ? str(formData, "username").toLowerCase() : null;
  const password = str(formData, "password");
  const email = optStr(formData, "email")?.toLowerCase() ?? null;
  const role = oneOf(formData, "role", ROLES.filter((r) => r !== "pending"));
  if (!fullName) return { error: "Enter the person's name." };
  if (username !== null && !/^[a-z0-9_-]{4,64}$/.test(username)) {
    return { error: "Username must be at least 4 characters: letters, numbers, dashes or underscores (no spaces or dots)." };
  }
  if (!username && !email) return { error: "Enter an email address — it is used to sign in." };
  if (settings.emailRequired && !email) return { error: "Clerk is set to require an email address for every account." };
  if (password.length < 8 || password.length > 15) return { error: "Password must be 8 to 15 characters." };
  if (!validEmail(email)) return { error: "Enter a valid email address or leave it empty." };

  const [firstName, ...rest] = fullName.split(/\s+/);
  let userId: string;
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      ...(username ? { username } : {}),
      ...(email && settings.email ? { emailAddress: [email] } : {}),
      password,
      firstName,
      // Clerk may require a last name; people with a single name get a placeholder there only.
      lastName: rest.join(" ") || "-",
    });
    userId = user.id;
  } catch (err) {
    return { error: clerkError(err) };
  }

  await db.insert(profiles).values({ id: userId, username, fullName, email, role, jobTitle: optStr(formData, "jobTitle") });
  revalidatePath("/users");
  redirect(`/users?created=${encodeURIComponent(username ?? email ?? fullName)}`);
}

export async function updateUser(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile(USER_ADMIN_ROLES);
  const fullName = str(formData, "fullName");
  const email = optStr(formData, "email");
  const role = oneOf(formData, "role", ROLES);
  const active = formData.get("active") === "on";
  if (!fullName) return { error: "Enter the person's name." };
  if (!validEmail(email)) return { error: "Enter a valid email address or leave it empty." };
  if (id === me.id && (!USER_ADMIN_ROLES.includes(role) || !active)) return { error: "You can't remove your own admin access." };

  const [current] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!current) return { error: "User not found." };

  if (current.active !== active) {
    try {
      const client = await clerkClient();
      if (active) await client.users.unbanUser(id);
      else await client.users.banUser(id);
    } catch (err) {
      return { error: clerkError(err) };
    }
  }

  await db
    .update(profiles)
    .set({ fullName, email, role, active, jobTitle: optStr(formData, "jobTitle"), updatedAt: new Date() })
    .where(eq(profiles.id, id));
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return { ok: "Saved." };
}

export async function resetPassword(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(USER_ADMIN_ROLES);
  const password = str(formData, "password");
  if (password.length < 8 || password.length > 15) return { error: "Password must be 8 to 15 characters." };
  try {
    const client = await clerkClient();
    await client.users.updateUser(id, { password, signOutOfOtherSessions: true });
  } catch (err) {
    return { error: clerkError(err) };
  }
  return { ok: "Password updated. Share it with the user securely." };
}

export async function approveUser(id: string, formData: FormData): Promise<void> {
  await requireProfile(USER_ADMIN_ROLES);
  const role = oneOf(formData, "role", ROLES.filter((r) => r !== "pending"));
  await db.update(profiles).set({ role, updatedAt: new Date() }).where(eq(profiles.id, id));
  revalidatePath("/users");
}

/**
 * Removes the account from Clerk so it can no longer sign in. The profile row is kept (anonymised)
 * so closed work still shows who did it; work the person still had open goes back to the manager.
 */
export async function deleteUser(id: string): Promise<void> {
  const me = await requireProfile(USER_ADMIN_ROLES);
  if (id === me.id) redirect(`/users/${id}?error=self`);
  const [user] = await db.select().from(profiles).where(and(eq(profiles.id, id), isNull(profiles.deletedAt)));
  if (!user) redirect("/users");

  if (USER_ADMIN_ROLES.includes(user.role) && user.active) {
    const [others] = await db
      .select({ n: count() })
      .from(profiles)
      .where(and(inArray(profiles.role, USER_ADMIN_ROLES), eq(profiles.active, true), ne(profiles.id, id)));
    if (!others.n) redirect(`/users/${id}?error=last`);
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);
  } catch (err) {
    // Already gone from Clerk: carry on and tidy up the profile.
    if (!(isClerkAPIResponseError(err) && err.status === 404)) {
      console.error(err);
      redirect(`/users/${id}?error=clerk`);
    }
  }

  const now = new Date();
  const unassigned = await db
    .update(workOrders)
    .set({ assignedToId: null, assignedAt: null, startedAt: null, status: "open", updatedAt: now })
    .where(and(eq(workOrders.assignedToId, id), inArray(workOrders.status, ["assigned", "in_progress"])))
    .returning({ id: workOrders.id });
  if (unassigned.length) {
    await db.insert(workOrderEvents).values(
      unassigned.map((wo) => ({ workOrderId: wo.id, actorId: me.id, type: "updated" as const, note: `Unassigned: ${user.fullName}'s account was deleted.` })),
    );
  }
  await db.update(schedules).set({ assignedToId: null, updatedAt: now }).where(eq(schedules.assignedToId, id));
  await db
    .update(profiles)
    .set({ active: false, deletedAt: now, username: null, email: null, updatedAt: now })
    .where(eq(profiles.id, id));
  revalidatePath("/", "layout");
  redirect(`/users?deleted=${encodeURIComponent(user.fullName)}`);
}
