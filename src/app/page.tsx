import { auth } from "@clerk/nextjs/server";
import { CalendarClock, Camera, ClipboardCheck, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { APP_NAME, SCHOOL_NAME } from "@/lib/constants";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const features = [
    { icon: ClipboardCheck, title: "Work orders", text: "Record issues, assign them to the right technician and track them to closure." },
    { icon: Camera, title: "Photo proof", text: "Technicians can attach photos when a job is done, straight from their phone." },
    { icon: CalendarClock, title: "Preventive maintenance", text: "Recurring checks are created automatically on schedule." },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-800 to-brand-900 text-white">
      <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <header className="flex items-center gap-2 py-5 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Wrench className="size-5" />
          </span>
          {APP_NAME}
        </header>
        <main className="flex flex-1 flex-col justify-center py-10">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-200">{SCHOOL_NAME}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Maintenance management</h1>
          <p className="mt-4 max-w-xl text-lg text-brand-100">
            Report, assign and close maintenance work across the school, and measure how the team is doing.
          </p>
          <div className="mt-8">
            <ButtonLink href="/sign-in" variant="secondary" className="px-6 text-base">
              Sign in
            </ButtonLink>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl bg-white/10 p-5">
                <Icon className="size-6 text-brand-200" />
                <h2 className="mt-3 font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-brand-100">{text}</p>
              </div>
            ))}
          </div>
        </main>
        <footer className="py-6 text-xs text-brand-200">Accounts are created by the school&apos;s maintenance admin.</footer>
      </div>
    </div>
  );
}
