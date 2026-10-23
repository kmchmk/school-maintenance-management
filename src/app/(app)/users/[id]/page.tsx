import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/form-controls";
import { Card, Field, inputClass, PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { USER_ADMIN_ROLES } from "@/lib/constants";
import { getSignInSettings } from "@/lib/clerk-settings";
import { resetPassword, updateUser } from "../actions";

export const metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile(USER_ADMIN_ROLES);
  const { id } = await params;
  const [user] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!user) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={user.fullName} description={user.username ? `@${user.username}` : undefined} />
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
    </div>
  );
}
