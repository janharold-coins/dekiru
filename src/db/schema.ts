/**
 * Dekiru database (Postgres on Neon).
 *
 *   users ─┬─ decks ── deck_versions (draft | published, slides as JSON, theme)
 *          ├─ themes ── theme_versions (draft | published, look as JSON)
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
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";

export const role = pgEnum("role", ["admin", "manager", "member"]);
export const deckKind = pgEnum("deck_kind", ["master", "copy"]);
export const versionStatus = pgEnum("version_status", ["draft", "published"]);
export const viewKind = pgEnum("view_kind", ["link", "present"]);

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
  /** May create and edit themes (admins always can). Set on the People page. */
  canEditThemes: boolean("can_edit_themes").notNull().default(false),
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

/*
 * Claude connector sign-in (OAuth 2.1 via Better Auth's MCP plugin). Claude registers itself as a client,
 * the person signs in with Google, and Claude gets a token that acts as that person. Managed by Better Auth.
 */
export const oauthApplications = pgTable("oauth_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  icon: text("icon"),
  metadata: text("metadata"),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret"),
  redirectUrls: text("redirect_urls").notNull(),
  type: text("type").notNull(),
  disabled: boolean("disabled").default(false),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("oauth_applications_user").on(t.userId)]);

export const oauthAccessTokens = pgTable("oauth_access_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }).notNull(),
  clientId: text("client_id").notNull().references(() => oauthApplications.clientId, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("oauth_access_tokens_client").on(t.clientId), index("oauth_access_tokens_user").on(t.userId)]);

export const oauthConsents = pgTable("oauth_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id").notNull().references(() => oauthApplications.clientId, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(),
  consentGiven: boolean("consent_given").notNull(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("oauth_consents_client").on(t.clientId), index("oauth_consents_user").on(t.userId)]);

/** Master decks (company-wide) and personal copies. Ids are "dk-" + 8 hex characters, the same for every deck and never changed. */
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

/**
 * A theme is the look a deck applies to all its slides (backgrounds first; see src/deck/theme.ts).
 * Versioned like decks: edits land in one draft, publishing makes a new version, decks using the theme
 * follow its newest published version, and share links keep the look they were made with.
 */
export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

export const themeVersions = pgTable(
  "theme_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    themeId: text("theme_id").notNull().references(() => themes.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    status: versionStatus("status").notNull().default("draft"),
    tokens: jsonb("tokens").$type<ThemeTokens>().notNull(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: created(),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("theme_versions_theme_number").on(t.themeId, t.number),
    uniqueIndex("theme_versions_one_draft").on(t.themeId).where(sql`${t.status} = 'draft'`),
  ],
);

export const deckVersions = pgTable(
  "deck_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    /** 1, 2, 3… per deck, in order of creation. */
    number: integer("number").notNull(),
    status: versionStatus("status").notNull().default("draft"),
    /** Slides: full slide data or references to another deck's slide ({id, ref: "sales/s01"}). */
    slides: jsonb("slides").$type<SeedSlide[]>().notNull(),
    /** The deck's theme in this version (null = the default Coins.ph theme). Part of history, so Restore brings it back. */
    themeId: text("theme_id").references(() => themes.id),
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
  deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
  versionId: uuid("version_id").notNull().references(() => deckVersions.id),
  deckTitle: text("deck_title").notNull(),
  slides: jsonb("slides").$type<SlideData[]>().notNull(),
  /** The deck's look on the day the link was made, so later theme edits don't change a sent link. */
  theme: jsonb("theme").$type<ThemeTokens>(),
  label: text("label"), // e.g. the merchant it was sent to
  passwordHash: text("password_hash"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: created(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

/**
 * One viewing of a deck. Two kinds:
 *   link    — someone opened a share link. Split by who:
 *               recipient — not signed in (the client on their own; no identity or IP stored)
 *               team      — signed in (`internal`, `viewerId`): a rep presenting the link or checking it
 *   present — a signed-in rep used the deck's Present button (like presenting from Google Slides).
 *             `audience` is the optional "Presenting to…" note.
 * Time per visit = sum of its slide_views (visible time only).
 */
export const viewSessions = pgTable(
  "view_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: viewKind("kind").notNull().default("link"),
    deckId: text("deck_id").references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    versionId: uuid("version_id").references(() => deckVersions.id, { onDelete: "set null" }),
    linkId: uuid("link_id").references(() => shareLinks.id, { onDelete: "cascade" }),
    internal: boolean("internal").notNull().default(false),
    viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "set null" }),
    audience: text("audience"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("view_sessions_link").on(t.linkId, t.startedAt), index("view_sessions_deck").on(t.deckId, t.kind, t.startedAt)],
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

/** Old deck ids (readable slugs, before the uniform "dk-…" ids) → new ids, so old links and prompts still resolve. */
export const deckIdRenames = pgTable("deck_id_renames", {
  oldId: text("old_id").primaryKey(),
  newId: text("new_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
});
