CREATE TABLE "ui_source_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" text NOT NULL,
	"source_key" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ui_source_decisions" ADD CONSTRAINT "ui_source_decisions_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ui_source_decisions_component" ON "ui_source_decisions" USING btree ("component_id","created_at");