import { PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { Alert } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { USER_ADMIN_ROLES } from "@/lib/constants";
import { getSignInSettings } from "@/lib/clerk-settings";
import { createUser } from "../actions";

export const metadata = { title: "Add user" };

export default async function NewUserPage() {
  await requireProfile(USER_ADMIN_ROLES);
  const signIn = await getSignInSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add user" description="Create a sign-in for a staff member using the password you set." />
      {!signIn.username && (
        <div className="mb-4">
          <Alert tone="warning">
            Username sign-in is turned off in Clerk, so new accounts sign in with their email. To use usernames, enable{" "}
            <strong>Username</strong> in the Clerk dashboard under User &amp; authentication.
          </Alert>
        </div>
      )}
      <UserForm action={createUser} signIn={signIn} />
    </div>
  );
}
