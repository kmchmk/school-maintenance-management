import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkConfigured } from "@/lib/config";

export default async function Home() {
  if (!clerkConfigured) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold">Setup required</h1>
        <p className="mt-2 text-sm">
          Authentication is not configured yet. Set{" "}
          <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code>CLERK_SECRET_KEY</code> in the Vercel project environment
          variables and redeploy.
        </p>
      </div>
    );
  }

  const { userId } = await auth();
  if (userId) redirect("/tasks");

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">School Maintenance Tasks</h1>
      <p className="mt-3 text-slate-600">
        Report, assign and track maintenance work across the school.
      </p>
      <Link
        href="/sign-in"
        className="mt-8 inline-block rounded-md bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
      >
        Sign in to continue
      </Link>
    </div>
  );
}
