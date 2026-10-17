# Stafford Maintenance

Maintenance management for Stafford International School (Colombo 7): work orders, preventive
maintenance, photo proof of completed work, and technician KPIs. Installable on phones as a PWA.

**Stack:** Next.js 15 (App Router, server actions) · Clerk (auth) · Neon Postgres · Drizzle ORM ·
Tailwind CSS · Vercel (hosting + daily cron)

## How it works

| Role | Who | Can do |
| --- | --- | --- |
| **Admin** | Maintenance manager, owner, MD, principal, heads of section | Everything: create/assign work orders, close or reopen completed work, manage users, schedules and reports |
| **Supervisor** | Maintenance supervisor | Create, assign and track all work; preventive schedules; reports. Can also be assigned work |
| **Technician / Staff** | Technicians, drivers | See work assigned to them, start it, complete it with photo proof, comment |

Work order flow (from the maintenance manager's requirements):

1. A teacher reports an issue → an admin records it (date, reported by, type, building, classroom, description).
2. The admin or supervisor assigns it to a worker (optionally with a due date). The worker gets an email.
3. The worker starts the job and marks it completed with **at least one photo** as proof. Admins get an email.
4. The maintenance manager reviews the photos and **closes** it, or **reopens** it with a reason.

Preventive maintenance schedules (weekly → yearly) create work orders automatically every day at
06:00 Colombo time (`vercel.json` cron → `/api/cron/schedules`).

Reports show, per technician: assigned, completed, completion rate, open, overdue, average response
time (assigned → started), average resolution time (assigned → completed), on-time rate and reopen
count, plus breakdowns by type and building and a CSV export.

### Accounts

- The **first person to sign in** becomes an admin. Everyone else who signs up waits on a
  "pending" screen until an admin approves them on **Users**.
- Admins can create accounts directly (**Users → Add user**), set passwords, change roles and
  deactivate people (deactivation also bans them in Clerk).
- Sign-in identifiers come from the Clerk instance settings. To sign in with **username + password**,
  enable *Username* in Clerk → User & authentication. The "Add user" form adapts automatically.

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon pooled connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | yes | From the Clerk dashboard (set by the Vercel Clerk integration) |
| `CRON_SECRET` | yes on Vercel | Any random string; Vercel Cron sends it to `/api/cron/schedules` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | for email | e.g. Gmail: `smtp.gmail.com`, `465`, the address, an [app password](https://myaccount.google.com/apppasswords). Without these, emails are skipped and logged |
| `EMAIL_FROM` | optional | e.g. `Stafford Maintenance <maintenance@example.com>` |
| `APP_URL` | optional | Link base for emails; defaults to the Vercel production URL |

## Development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run db:migrate           # apply migrations (uses Neon's HTTP driver)
npm run dev
```

Schema lives in `src/db/schema.ts`. After changing it run `npm run db:generate` and commit the new
SQL in `drizzle/`. Production builds on Vercel run the migrations automatically (`npm run build`);
preview builds skip them.
