CREATE TYPE "public"."building" AS ENUM('al_building', 'main_building', 'primary_building', 'eyfs_site', 'other');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'supervisor', 'staff', 'pending');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('open', 'assigned', 'in_progress', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('electrical', 'hvac', 'plumbing', 'cctv', 'fire', 'other');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"full_name" text NOT NULL,
	"email" text,
	"job_title" text,
	"role" "role" DEFAULT 'pending' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"type" "work_type" NOT NULL,
	"building" "building" NOT NULL,
	"classroom" text,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"assigned_to_id" text,
	"frequency" "frequency" NOT NULL,
	"next_due_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_generated_at" timestamp with time zone,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" integer NOT NULL,
	"actor_id" text,
	"type" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" integer NOT NULL,
	"kind" text NOT NULL,
	"content_type" text NOT NULL,
	"data" "bytea" NOT NULL,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reported_date" date DEFAULT CURRENT_DATE NOT NULL,
	"reported_by" text NOT NULL,
	"type" "work_type" NOT NULL,
	"building" "building" NOT NULL,
	"classroom" text,
	"description" text NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"status" "work_order_status" DEFAULT 'open' NOT NULL,
	"due_date" date,
	"assigned_to_id" text,
	"assigned_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completion_notes" text,
	"closed_at" timestamp with time zone,
	"closed_by_id" text,
	"reopen_count" integer DEFAULT 0 NOT NULL,
	"schedule_id" integer,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_assigned_to_id_profiles_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_photos" ADD CONSTRAINT "work_order_photos_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_photos" ADD CONSTRAINT "work_order_photos_uploaded_by_id_profiles_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_id_profiles_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_closed_by_id_profiles_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_order_events_work_order_idx" ON "work_order_events" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "work_order_photos_work_order_idx" ON "work_order_photos" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "work_orders_status_idx" ON "work_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_orders_assigned_to_idx" ON "work_orders" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "work_orders_reported_date_idx" ON "work_orders" USING btree ("reported_date");