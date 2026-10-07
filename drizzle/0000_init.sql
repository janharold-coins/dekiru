CREATE TYPE "public"."deck_kind" AS ENUM('master', 'copy');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'manager', 'member');--> statement-breakpoint
CREATE TYPE "public"."version_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "deck_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" text NOT NULL,
	"number" integer NOT NULL,
	"status" "version_status" DEFAULT 'draft' NOT NULL,
	"slides" jsonb NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" uuid,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"kind" "deck_kind" DEFAULT 'copy' NOT NULL,
	"owner_id" uuid,
	"copied_from_deck_id" text,
	"copied_from_version_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"deck_id" text NOT NULL,
	"version_id" uuid NOT NULL,
	"label" text,
	"password_hash" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "share_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "slide_views" (
	"session_id" uuid NOT NULL,
	"slide_id" text NOT NULL,
	"ms" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"role" "role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "view_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_versions" ADD CONSTRAINT "deck_versions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_versions" ADD CONSTRAINT "deck_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_versions" ADD CONSTRAINT "deck_versions_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_version_id_deck_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."deck_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slide_views" ADD CONSTRAINT "slide_views_session_id_view_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."view_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_link_id_share_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."share_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deck_versions_deck_number" ON "deck_versions" USING btree ("deck_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "deck_versions_one_draft" ON "deck_versions" USING btree ("deck_id") WHERE "deck_versions"."status" = 'draft';--> statement-breakpoint
CREATE INDEX "deck_versions_published" ON "deck_versions" USING btree ("deck_id","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "slide_views_session_slide" ON "slide_views" USING btree ("session_id","slide_id");--> statement-breakpoint
CREATE INDEX "view_sessions_link" ON "view_sessions" USING btree ("link_id","started_at");