CREATE TABLE "theme_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
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
CREATE TABLE "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_versions" ADD COLUMN "theme_id" text;--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "theme" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_edit_themes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "theme_versions_theme_number" ON "theme_versions" USING btree ("theme_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "theme_versions_one_draft" ON "theme_versions" USING btree ("theme_id") WHERE "theme_versions"."status" = 'draft';--> statement-breakpoint
ALTER TABLE "deck_versions" ADD CONSTRAINT "deck_versions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;