ALTER TABLE "share_links" ADD COLUMN "deck_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "slides" jsonb NOT NULL;