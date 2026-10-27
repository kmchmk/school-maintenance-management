CREATE TABLE "work_order_helpers" (
	"work_order_id" integer NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_order_helpers_work_order_id_profile_id_pk" PRIMARY KEY("work_order_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "work_order_helpers" ADD CONSTRAINT "work_order_helpers_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_helpers" ADD CONSTRAINT "work_order_helpers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_order_helpers_profile_idx" ON "work_order_helpers" USING btree ("profile_id");