import { UserButton } from "@clerk/nextjs";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { APP_NAME, ROLE_LABELS } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-brand-800 pt-[env(safe-area-inset-top)] text-white shadow">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Wrench className="size-4" />
            </span>
            <span className="truncate">{APP_NAME}</span>
          </Link>
          <div className="flex-1">
            <DesktopNav role={profile.role} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{profile.fullName}</p>
              <p className="text-xs text-brand-200">{ROLE_LABELS[profile.role]}</p>
            </div>
            <div className="size-8 rounded-full bg-white/15">
              <UserButton />
            </div>
          </div>
        </div>
      </header>
      <main className="pb-tabbar mx-auto max-w-6xl px-4 pt-6">{children}</main>
      <MobileNav role={profile.role} />
    </div>
  );
}
