CREATE TABLE "deck_id_renames" (
	"old_id" text PRIMARY KEY NOT NULL,
	"new_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_versions" DROP CONSTRAINT "deck_versions_deck_id_decks_id_fk";
--> statement-breakpoint
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_deck_id_decks_id_fk";
--> statement-breakpoint
ALTER TABLE "view_sessions" DROP CONSTRAINT "view_sessions_deck_id_decks_id_fk";
--> statement-breakpoint
ALTER TABLE "deck_id_renames" ADD CONSTRAINT "deck_id_renames_new_id_decks_id_fk" FOREIGN KEY ("new_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deck_versions" ADD CONSTRAINT "deck_versions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
-- Data: give every deck the uniform "dk-" + 8 hex id. Masters get fixed ids (they match src/content/decks/*.json).
-- Dependent rows follow through ON UPDATE CASCADE; slide references inside JSON ("sales/s04") are rewritten below.
CREATE TEMP TABLE "deck_id_map" AS
SELECT "id" AS "old_id",
       CASE "id" WHEN 'sales' THEN 'dk-645bd167' WHEN 'ramp' THEN 'dk-5e098a0e'
                 ELSE 'dk-' || substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 8) END AS "new_id"
FROM "decks" WHERE "id" !~ '^dk-[0-9a-f]{8}$';
--> statement-breakpoint
UPDATE "decks" d SET "id" = m."new_id" FROM "deck_id_map" m WHERE d."id" = m."old_id";
--> statement-breakpoint
UPDATE "decks" d SET "copied_from_deck_id" = m."new_id" FROM "deck_id_map" m WHERE d."copied_from_deck_id" = m."old_id";
--> statement-breakpoint
UPDATE "deck_versions" v SET "slides" = (
  SELECT jsonb_agg(CASE WHEN m."old_id" IS NOT NULL
                        THEN jsonb_set(t.e, '{ref}', to_jsonb(m."new_id" || substr(t.e->>'ref', length(m."old_id") + 1)))
                        ELSE t.e END ORDER BY t.ord)
  FROM jsonb_array_elements(v."slides") WITH ORDINALITY AS t(e, ord)
  LEFT JOIN "deck_id_map" m ON t.e ? 'ref' AND m."old_id" = split_part(t.e->>'ref', '/', 1)
) WHERE jsonb_typeof(v."slides") = 'array' AND jsonb_array_length(v."slides") > 0 AND v."slides"::text LIKE '%"ref"%';
--> statement-breakpoint
UPDATE "share_links" l SET "slides" = (
  SELECT jsonb_agg(CASE WHEN m."old_id" IS NOT NULL
                        THEN jsonb_set(t.e, '{ref}', to_jsonb(m."new_id" || substr(t.e->>'ref', length(m."old_id") + 1)))
                        ELSE t.e END ORDER BY t.ord)
  FROM jsonb_array_elements(l."slides") WITH ORDINALITY AS t(e, ord)
  LEFT JOIN "deck_id_map" m ON t.e ? 'ref' AND m."old_id" = split_part(t.e->>'ref', '/', 1)
) WHERE jsonb_typeof(l."slides") = 'array' AND jsonb_array_length(l."slides") > 0 AND l."slides"::text LIKE '%"ref"%';
--> statement-breakpoint
INSERT INTO "deck_id_renames" ("old_id", "new_id") SELECT "old_id", "new_id" FROM "deck_id_map";
--> statement-breakpoint
DROP TABLE "deck_id_map";
