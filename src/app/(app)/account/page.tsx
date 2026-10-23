import { UserProfile } from "@clerk/nextjs";
import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  await requireProfile();
  return (
    <>
      <PageHeader
        title="My account"
        description="You can change your password any time after your first sign-in."
        actions={
          // Clerk's profile uses hash routing; this opens its Security page, where the password is changed.
          <a
            href="#/security"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            <KeyRound className="size-4" /> Change password
          </a>
        }
      />
      <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-cardBox]:max-w-none">
        <UserProfile routing="hash" />
      </div>
    </>
  );
}
