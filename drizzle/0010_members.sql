CREATE TYPE "public"."member_role" AS ENUM('editor', 'viewer');--> statement-breakpoint
CREATE TABLE "deck_members" (
	"deck_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'viewer' NOT NULL,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deck_members_deck_id_user_id_pk" PRIMARY KEY("deck_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "deck_members" ADD CONSTRAINT "deck_members_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deck_members" ADD CONSTRAINT "deck_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_members" ADD CONSTRAINT "deck_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;