CREATE TABLE "deck_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" text NOT NULL,
	"slide_id" text NOT NULL,
	"parent_id" uuid,
	"author_id" uuid,
	"body" text NOT NULL,
	"anchor" jsonb,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_comments" ADD CONSTRAINT "deck_comments_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deck_comments" ADD CONSTRAINT "deck_comments_parent_id_deck_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deck_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_comments" ADD CONSTRAINT "deck_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_comments" ADD CONSTRAINT "deck_comments_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_comments_slide" ON "deck_comments" USING btree ("deck_id","slide_id","created_at");