/**
 * Dekiru database (Postgres on Neon).
 *
 *   users ─┬─ decks ── deck_versions (draft | published, slides as JSON)
 *          ├─ share_links → one frozen published version ── view_sessions ── slide_views
 *          └─ sessions, accounts (Google sign-in, managed by Better Auth) + verifications
 *
 * A deck's content lives in its versions. Each deck has at most one draft (where edits land)
 * and any number of published versions; the newest published one is what people see.
 * Share links point at a specific published version, so publishing again never changes
 * what an existing link shows.
 */
import { sql } from "drizzle-orm";
import {
  boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import type { SeedSlide } from "@/content/resolve";
import type { SlideData } from "@/deck/types";

export const role = pgEnum("role", ["admin", "manager", "member"]);
export const deckKind = pgEnum("deck_kind", ["master", "copy"]);
export const versionStatus = pgEnum("version_status", ["draft", "published"]);

const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

/**
 * Filled on first Google sign-in (coins.ph accounts only). The first person to sign in becomes admin.
 * Admins and managers edit masters and approve; members copy and submit.
 * Column set follows Better Auth's user model (src/lib/auth.ts), plus `role`.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull().default(""),
  image: text("image"),
  role: role("role").notNull().default("member"),
  createdAt: created(),
  updatedAt: updated(),
});

/* Sign-in plumbing, read and written only by Better Auth. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("sessions_user").on(t.userId)]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("accounts_user").on(t.userId)]);

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("verifications_identifier").on(t.identifier)]);

/** Master decks (company-wide) and personal copies. Slug ids keep URLs readable: /decks/sales. */
export const decks = pgTable("decks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kind: deckKind("kind").notNull().default("copy"),
  ownerId: uuid("owner_id").references(() => users.id), // null for masters seeded from Figma
  copiedFromDeckId: text("copied_from_deck_id"),
  copiedFromVersionId: uuid("copied_from_version_id"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

export const deckVersions = pgTable(
  "deck_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    /** 1, 2, 3… per deck, in order of creation. */
    number: integer("number").notNull(),
    status: versionStatus("status").notNull().default("draft"),
    /** Slides: full slide data or references to another deck's slide ({id, ref: "sales/s01"}). */
    slides: jsonb("slides").$type<SeedSlide[]>().notNull(),
    /** What changed — shown in version history and approval requests. */
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: created(),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("deck_versions_deck_number").on(t.deckId, t.number),
    uniqueIndex("deck_versions_one_draft").on(t.deckId).where(sql`${t.status} = 'draft'`),
    index("deck_versions_published").on(t.deckId, t.publishedAt),
  ],
);

/**
 * Public URL for one published version. Password on by default (scrypt hash); null = open link.
 * `slides` is the version as shown on the day the link was made, references already resolved,
 * so later edits to a shared master slide don't change what a sent link shows.
 */
export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  versionId: uuid("version_id").notNull().references(() => deckVersions.id),
  deckTitle: text("deck_title").notNull(),
  slides: jsonb("slides").$type<SlideData[]>().notNull(),
  label: text("label"), // e.g. the merchant it was sent to
  passwordHash: text("password_hash"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: created(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

/** One open of a share link (a visit). Time per deck = lastSeenAt − startedAt. No IPs stored. */
export const viewSessions = pgTable(
  "view_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id").notNull().references(() => shareLinks.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("view_sessions_link").on(t.linkId, t.startedAt)],
);

/** Time spent on a slide during a visit (one row per slide per visit, ms accumulated). */
export const slideViews = pgTable(
  "slide_views",
  {
    sessionId: uuid("session_id").notNull().references(() => viewSessions.id, { onDelete: "cascade" }),
    slideId: text("slide_id").notNull(),
    ms: integer("ms").notNull().default(0),
  },
  (t) => [uniqueIndex("slide_views_session_slide").on(t.sessionId, t.slideId)],
);
