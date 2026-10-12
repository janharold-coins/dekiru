CREATE TYPE "public"."view_kind" AS ENUM('link', 'present');--> statement-breakpoint
ALTER TABLE "view_sessions" ALTER COLUMN "link_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "kind" "view_kind" DEFAULT 'link' NOT NULL;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "deck_id" text;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "version_id" uuid;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "audience" text;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_version_id_deck_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."deck_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_sessions_deck" ON "view_sessions" USING btree ("deck_id","kind","started_at");--> statement-breakpoint
UPDATE "view_sessions" v SET "deck_id" = l."deck_id", "version_id" = l."version_id" FROM "share_links" l WHERE v."link_id" = l."id" AND v."deck_id" IS NULL;
