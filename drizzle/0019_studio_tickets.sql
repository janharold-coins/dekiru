CREATE TABLE "studio_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"note" text,
	"refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_requests" ADD COLUMN "status" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_requests" ADD COLUMN "merged_into" uuid;--> statement-breakpoint
ALTER TABLE "studio_requests" ADD COLUMN "draft_loop" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_events" ADD CONSTRAINT "studio_events_request_id_studio_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."studio_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_events" ADD CONSTRAINT "studio_events_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_events_request" ON "studio_events" USING btree ("request_id","created_at");--> statement-breakpoint
-- Requests from before tickets: open ones were already in Claude's build queue (approved); closed rule changes are done,
-- other closed ones were dismissed (withdrawn). Every earlier author had Studio access, so remixes keep the draft loop.
UPDATE "studio_requests" SET
	"status" = CASE WHEN "closed_at" IS NULL THEN 'approved' WHEN "kind" = 'rule' THEN 'done' ELSE 'withdrawn' END,
	"draft_loop" = true;
