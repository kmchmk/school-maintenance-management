# School Maintenance Management

A web app for reporting and tracking school maintenance tasks.

**Stack:** Next.js 15 (App Router) · Clerk (username + password auth) · Neon Postgres · Drizzle ORM · Tailwind CSS · Vercel

## Local development

```bash
cp .env.example .env.local   # fill in DATABASE_URL and Clerk keys
npm install
npm run dev
```

## Database

Schema lives in `src/db/schema.ts`. After changing it:

```bash
npm run db:generate   # writes a SQL migration to ./drizzle
npm run db:migrate    # applies it to DATABASE_URL
```

## Clerk setup (username + password)

In the Clerk dashboard → **User & authentication**:

- Enable **Username** and make it required.
- Enable **Password**.
- Disable email/phone sign-in methods if only username/password is wanted.

### Production on `*.vercel.app`

Clerk production keys work on `school-maintenance-management.vercel.app`
without DNS records: `@clerk/nextjs` v7+ auto-proxies Clerk's Frontend API
through `/__clerk` on the app's own origin. The middleware matcher includes
`/__clerk/:path*` so those requests (including the clerk-js bundle) reach
Clerk's middleware. Auth emails (verification and password-reset codes) go
out via Clerk's shared `accounts.dev` email infrastructure.

A custom domain is still recommended for fully branded production behavior:
custom email templates, email-link authentication, and app/organization
invitations.

## Environment variables

See `.env.example`. Set the same values in the Vercel project settings.
