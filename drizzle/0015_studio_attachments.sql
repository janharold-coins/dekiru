CREATE TABLE "studio_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_attachments" ADD CONSTRAINT "studio_attachments_decision_id_studio_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."studio_decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_attachments_decision" ON "studio_attachments" USING btree ("decision_id");