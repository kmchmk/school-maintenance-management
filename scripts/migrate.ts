// Applies Drizzle migrations over Neon's HTTP driver (works where TCP 5432 is blocked).
// On Vercel it only runs for production builds so preview deploys never touch the schema.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
    console.log(`Skipping migrations for VERCEL_ENV=${process.env.VERCEL_ENV}`);
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
