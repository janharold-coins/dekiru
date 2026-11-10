CREATE TABLE "preset_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preset_id" text NOT NULL,
	"number" integer NOT NULL,
	"status" "version_status" DEFAULT 'draft' NOT NULL,
	"tokens" jsonb NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" uuid,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "presets" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preset_versions" ADD CONSTRAINT "preset_versions_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_versions" ADD CONSTRAINT "preset_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_versions" ADD CONSTRAINT "preset_versions_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presets" ADD CONSTRAINT "presets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "preset_versions_preset_number" ON "preset_versions" USING btree ("preset_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "preset_versions_one_draft" ON "preset_versions" USING btree ("preset_id") WHERE "preset_versions"."status" = 'draft';