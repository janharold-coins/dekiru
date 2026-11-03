CREATE TABLE "studio_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"revision" integer NOT NULL,
	"decision" text NOT NULL,
	"note" text,
	"by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"prompt" text NOT NULL,
	"author_id" uuid,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_use_studio" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_decisions" ADD CONSTRAINT "studio_decisions_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_requests" ADD CONSTRAINT "studio_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_decisions_proposal" ON "studio_decisions" USING btree ("proposal_id","created_at");--> statement-breakpoint
CREATE INDEX "studio_requests_open" ON "studio_requests" USING btree ("closed_at","created_at");