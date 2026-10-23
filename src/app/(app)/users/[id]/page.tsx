import { and, eq, isNull } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/form-controls";
import { Alert, btn, Card, cn, Field, inputClass, PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { USER_ADMIN_ROLES } from "@/lib/constants";
import { getSignInSettings } from "@/lib/clerk-settings";
import { deleteUser, resetPassword, updateUser } from "../actions";

const ERRORS: Record<string, string> = {
  self: "You can't delete your own account. Ask another admin to do it.",
  last: "This is the last admin account. Give someone else admin or maintenance manager access first.",
  clerk: "Couldn't delete the account in Clerk. Please try again.",
};

export const metadata = { title: "Edit user" };

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireProfile(USER_ADMIN_ROLES);
  const { id } = await params;
  const { error } = await searchParams;
  const [user] = await db.select().from(profiles).where(and(eq(profiles.id, id), isNull(profiles.deletedAt)));
  if (!user) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={user.fullName} description={user.username ? `@${user.username}` : undefined} />
      {error && ERRORS[error] && <Alert tone="error">{ERRORS[error]}</Alert>}
      <UserForm action={updateUser.bind(null, id)} user={user} signIn={await getSignInSettings()} />
      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold text-slate-900">Reset password</h2>
        <ActionForm action={resetPassword.bind(null, id)} className="mt-3 space-y-3" resetOnSuccess>
          <Field label="New password" htmlFor="new-password" hint="At least 8 characters. Signs them out of other devices.">
            <input id="new-password" name="password" type="text" minLength={8} required autoComplete="new-password" className={inputClass} />
          </Field>
          <SubmitButton variant="secondary">Set new password</SubmitButton>
        </ActionForm>
      </Card>
      {id !== me.id && (
        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold text-slate-900">Delete account</h2>
          <p className="mt-1 text-sm text-slate-600">
            Removes their sign-in for good. Their name stays on past work orders, and any work they still have open goes back
            to &ldquo;waiting to be assigned&rdquo;. To block someone temporarily, untick <em>Active</em> instead.
          </p>
          <form action={deleteUser.bind(null, id)} className="mt-3">
            <ConfirmButton
              message={`Delete ${user.fullName}'s account? They will no longer be able to sign in. This cannot be undone.`}
              className={cn(btn.base, btn.danger)}
            >
              <Trash2 className="size-4" /> Delete account
            </ConfirmButton>
          </form>
        </Card>
      )}
    </div>
  );
}
