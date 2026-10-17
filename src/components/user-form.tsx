"use client";

import type { Profile } from "@/db/schema";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/forms";
import { ActionForm, SubmitButton } from "./form-controls";
import { ButtonLink, Card, Field, inputClass } from "./ui";

export function UserForm({
  action,
  user,
  signIn,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  user?: Profile;
  signIn: { username: boolean; email: boolean; emailRequired: boolean };
}) {
  const editing = !!user;
  return (
    <ActionForm action={action} className="space-y-6">
      <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <Field label="Full name" htmlFor="fullName" required>
          <input id="fullName" name="fullName" required defaultValue={user?.fullName} className={inputClass} autoComplete="off" />
        </Field>
        {editing ? (
          <Field label="Username" htmlFor="username" hint="Usernames can't be changed.">
            <input id="username" disabled value={user.username ?? "—"} className={inputClass} />
          </Field>
        ) : (
          signIn.username && (
            <Field label="Username" htmlFor="username" required hint="Used to sign in. At least 4 characters, lowercase.">
              <input id="username" name="username" required minLength={4} autoCapitalize="none" autoCorrect="off" autoComplete="off" className={inputClass} />
            </Field>
          )
        )}
        {!editing && (
          <Field label="Temporary password" htmlFor="password" required hint="At least 8 characters. Share it with them in person.">
            <input id="password" name="password" type="text" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
        )}
        <Field label="Role" htmlFor="role" required>
          <select id="role" name="role" defaultValue={user?.role ?? "staff"} className={inputClass}>
            {ROLES.filter((r) => editing || r !== "pending").map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Job title" htmlFor="jobTitle" hint="e.g. Electrician, Driver, Principal">
          <input id="jobTitle" name="jobTitle" defaultValue={user?.jobTitle ?? ""} className={inputClass} />
        </Field>
        {(() => {
          const signInEmail = !editing && (!signIn.username || signIn.emailRequired);
          return (
            <Field
              label={signInEmail ? "Email (used to sign in)" : "Email for notifications"}
              htmlFor="email"
              required={signInEmail}
              hint={signInEmail ? "They sign in with this email and the password you set." : "Optional. Used for assignment and completion emails."}
            >
              <input id="email" name="email" type="email" required={signInEmail} defaultValue={user?.email ?? ""} className={inputClass} autoCapitalize="none" />
            </Field>
          );
        })()}
        {editing && (
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={user.active} className="size-5 rounded border-slate-300" />
            <span className="text-sm text-slate-800">Active (can sign in)</span>
          </label>
        )}
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:col-span-2">
          <strong>Admin</strong>: everything, including closing work orders and managing users. <strong>Supervisor</strong>: create, assign and
          track all work, preventive schedules and reports; can also be assigned work. <strong>Technician / Staff</strong>: sees and completes
          work assigned to them.
        </div>
      </Card>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href="/users" variant="secondary">{editing ? "Back" : "Cancel"}</ButtonLink>
        <SubmitButton>{editing ? "Save changes" : "Create account"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
