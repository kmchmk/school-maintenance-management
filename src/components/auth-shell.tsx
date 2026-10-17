import { Wrench } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-100 px-4 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold text-brand-800">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-700 text-white">
          <Wrench className="size-5" />
        </span>
        {APP_NAME}
      </Link>
      {children}
    </div>
  );
}
