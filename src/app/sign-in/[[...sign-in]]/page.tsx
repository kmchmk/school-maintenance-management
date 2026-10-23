import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell>
      {/* Accounts are created by admins, so an unknown username is a typo: show "account not found" rather than sign-up. */}
      <SignIn fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
      <p className="mt-6 max-w-sm text-center text-sm text-slate-600">
        Use the username and password you were given. Usernames are lowercase, e.g. <span className="font-medium">suvin_w</span>.
        Can&rsquo;t sign in? Ask the Maintenance Manager.
      </p>
    </AuthShell>
  );
}
