import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { clerkConfigured } from "@/lib/config";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          🏫 School Maintenance
        </Link>
        {clerkConfigured && (
          <nav className="flex items-center gap-4 text-sm">
            <Show when="signed-in">
              <Link href="/tasks" className="hover:underline">
                Tasks
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton>
                <button className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </nav>
        )}
      </div>
    </header>
  );
}
