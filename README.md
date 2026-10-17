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

## Environment variables

See `.env.example`. Set the same values in the Vercel project settings.
