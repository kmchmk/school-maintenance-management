# Stafford Maintenance

Maintenance management for Stafford International School (Colombo 7): work orders, preventive
maintenance, photo proof of completed work, and technician KPIs. Installable on phones as a PWA.

**Stack:** Next.js 15 (App Router, server actions) · Clerk (auth) · Neon Postgres · Drizzle ORM ·
Tailwind CSS · Vercel (hosting + daily cron)

## How it works

| Role | Who | Can do |
| --- | --- | --- |
| **Maintenance manager** | Maintenance manager | Raise work orders, assign them, close or reopen completed work, preventive schedules, board, reports, manage users. Can also be assigned work |
| **Admin** | Owner, MD, principal, heads of section | Raise and edit work orders, track all work, board and reports, manage users |
| **Supervisor** | Maintenance supervisor | Track all work, board and reports (can't raise work orders). Can be assigned work |
| **Technician / Driver** | Technicians, drivers | See work assigned to them, start it, complete it with photo proof, comment |

Work order flow (from the maintenance manager's requirements):

1. A teacher reports an issue → an admin or the manager records it (date, reported by, type, building, classroom, description).
   The maintenance manager gets an email when new work is waiting to be assigned.
2. The maintenance manager assigns it to a worker (optionally with a due date). The worker gets an email.
3. The worker starts the job and marks it completed with **at least one photo** as proof. The manager gets an email.
4. The maintenance manager reviews the photos and **closes** it, or **reopens** it with a reason.

Preventive maintenance schedules (weekly → yearly) create work orders automatically every day at
06:00 Colombo time (`vercel.json` cron → `/api/cron/schedules`).

Reports show, per technician: assigned, completed, completion rate, open, overdue, average response
time (assigned → started), average resolution time (assigned → completed), on-time rate and reopen
count, plus breakdowns by type and building and a CSV export.

### Accounts

- The **first person to sign in** becomes an admin. Everyone else who signs up waits on a
  "pending" screen until an admin approves them on **Users**.
- Admins and the manager can create accounts directly (**Users → Add user**), set passwords, change
  roles, deactivate people (deactivation also bans them in Clerk) and delete accounts. A deleted
  account is removed from Clerk; its name stays on the work orders it was part of, and its open
  work goes back to "waiting to be assigned".
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
