ALTER TYPE "public"."building" ADD VALUE 'main_and_eyfs' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."frequency" ADD VALUE 'custom';--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "details" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "custom_dates" text[] DEFAULT '{}' NOT NULL;