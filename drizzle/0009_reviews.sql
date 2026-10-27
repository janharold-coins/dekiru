CREATE TYPE "public"."review_event" AS ENUM('sent', 'slide_approved', 'deck_approved', 'approved', 'changes_requested', 'override', 'withdrawn', 'promoted');--> statement-breakpoint
CREATE TYPE "public"."review_kind" AS ENUM('employee', 'company', 'translation');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('for_review', 'changes_requested', 'approved', 'withdrawn');--> statement-breakpoint
CREATE TABLE "review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" text NOT NULL,
	"review_id" uuid,
	"event" "review_event" NOT NULL,
	"user_id" uuid,
	"slide_id" text,
	"lang" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" text NOT NULL,
	"version_id" uuid NOT NULL,
	"kind" "review_kind" NOT NULL,
	"lang" text,
	"status" "review_status" DEFAULT 'for_review' NOT NULL,
	"required" integer DEFAULT 1 NOT NULL,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "slide_approvals" (
	"review_id" uuid NOT NULL,
	"slide_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "approved" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "review_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_version_id_deck_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."deck_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slide_approvals" ADD CONSTRAINT "slide_approvals_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slide_approvals" ADD CONSTRAINT "slide_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_events_deck" ON "review_events" USING btree ("deck_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_deck" ON "reviews" USING btree ("deck_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_version" ON "reviews" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slide_approvals_one" ON "slide_approvals" USING btree ("review_id","slide_id","user_id");