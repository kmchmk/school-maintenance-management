import { SignOutButton } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { btn, Card, cn } from "@/components/ui";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Waiting for access" };

export default async function PendingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/sign-in");
  if (profile.active && profile.role !== "pending") redirect("/dashboard");

  return (
    <AuthShell>
      <Card className="w-full max-w-md p-6 text-center">
        <Clock className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold">
          {profile.active ? "Waiting for an admin" : "Account deactivated"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {profile.active
            ? `You're signed in as ${profile.fullName}, but an admin still needs to give you access. Ask the Maintenance Manager to approve your account.`
            : "Your account has been deactivated. Contact the Maintenance Manager if you need access again."}
        </p>
        <SignOutButton redirectUrl="/">
          <button className={cn(btn.base, btn.secondary, "mt-6 w-full")}>Sign out</button>
        </SignOutButton>
      </Card>
    </AuthShell>
  );
}
