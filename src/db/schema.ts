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
  boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { SeedSlide } from "@/content/resolve";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";

export const role = pgEnum("role", ["admin", "manager", "member"]);
export const deckKind = pgEnum("deck_kind", ["master", "copy"]);
export const versionStatus = pgEnum("version_status", ["draft", "published"]);
export const viewKind = pgEnum("view_kind", ["link", "present"]);
export const reviewKind = pgEnum("review_kind", ["employee", "company", "translation"]);
export const reviewStatus = pgEnum("review_status", ["for_review", "changes_requested", "approved", "withdrawn"]);
export const memberRole = pgEnum("member_role", ["editor", "viewer"]);
export const reviewEvent = pgEnum("review_event", ["sent", "slide_approved", "deck_approved", "approved", "changes_requested", "override", "withdrawn", "promoted"]);

const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

/**
 * Departments (Legal, Sales, Training…). One list, kept by admins on the People page: each person belongs to
 * one, and decks are tagged with any number of them (deck_tags), so a tag always means the same team.
 */
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: created(),
});

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
  /** May open the Studio, where new layouts and themes are requested and approved (admins always can). */
  canUseStudio: boolean("can_use_studio").notNull().default(false),
  /** What this person may review (see src/lib/reviews.ts): "employee", "company", "lang:zh", … Admins review everything. */
  reviewScopes: jsonb("review_scopes").$type<string[]>().notNull().default([]),
  /** Their department (set by admins on the People page); null = not set. */
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
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
  /**
   * Languages people's own decks offer besides English ("zh", "th"), turned on by the owner. Translations that
   * come with master slides stay hidden until the language is on. Masters ignore this: they offer every
   * language they hold a translation for.
   */
  languages: text("languages").array().notNull().default(sql`'{}'::text[]`),
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
  /** Which layers were approved when the link was made: "en" for the content, "zh"/"th" for translations. */
  approved: jsonb("approved").$type<string[]>().notNull().default([]),
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

/*
 * Review and approval (spec §7a). A review is about one published version of a deck: its content
 * ("employee" for personal copies, "company" for masters and promotions — 2 approvals) or one of its
 * translations ("translation" + lang — 2 approvals from reviewers of that language). Per-slide approvals
 * add up to the deck's; a new version starts a new review, carrying over approvals for unchanged slides.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    versionId: uuid("version_id").notNull().references(() => deckVersions.id, { onDelete: "cascade" }),
    kind: reviewKind("kind").notNull(),
    /** Language for translation reviews; null for content reviews. */
    lang: text("lang"),
    status: reviewStatus("status").notNull().default("for_review"),
    /** Approvals each slide needs (1 for employee decks, 2 for company decks and translations). */
    required: integer("required").notNull().default(1),
    requestedBy: uuid("requested_by").references(() => users.id),
    requestedAt: created(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    /** The reviewer's note when changes were requested. */
    note: text("note"),
  },
  (t) => [index("reviews_deck").on(t.deckId, t.requestedAt), index("reviews_version").on(t.versionId)],
);

/** One person's approval of one slide within a review. `fingerprint` is the slide content approved, so it can carry over. */
export const slideApprovals = pgTable(
  "slide_approvals",
  {
    reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
    slideId: text("slide_id").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("slide_approvals_one").on(t.reviewId, t.slideId, t.userId)],
);

/** What happened in a review, for the deck's history. */
export const reviewEvents = pgTable(
  "review_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }),
    event: reviewEvent("event").notNull(),
    userId: uuid("user_id").references(() => users.id),
    /** Slide for slide_approved; language for translation reviews; free text for notes. */
    slideId: text("slide_id"),
    lang: text("lang"),
    note: text("note"),
    createdAt: created(),
  },
  (t) => [index("review_events_deck").on(t.deckId, t.createdAt)],
);

/**
 * Tags on a deck: departments it's for (Legal, Training…). Belong to the deck, not a version, so retagging
 * never makes a new version or review. Copies start with their source's tags.
 */
export const deckTags = pgTable(
  "deck_tags",
  {
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.deckId, t.departmentId] }), index("deck_tags_department").on(t.departmentId)],
);

/** Old deck ids (readable slugs, before the uniform "dk-…" ids) → new ids, so old links and prompts still resolve. */
export const deckIdRenames = pgTable("deck_id_renames", {
  oldId: text("old_id").primaryKey(),
  newId: text("new_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

/**
 * People a deck is shared with (spec §7b): viewers see it, editors can change it. The owner isn't listed here.
 * Masters don't use this: everyone sees them, admins and managers edit them.
 */
export const deckMembers = pgTable(
  "deck_members",
  {
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("viewer"),
    addedBy: uuid("added_by").references(() => users.id),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.deckId, t.userId] })],
);

/**
 * In-app notifications (spec §7b): sent for review → reviewers; approved / changes requested → the requester;
 * a master slide you depend on changed → owners of dependent decks; shared with you → the invitee.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // "review_sent" | "approved" | "changes_requested" | "master_changed" | "shared"
    deckId: text("deck_id").references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    lang: text("lang"),
    text: text("text").notNull(),
    href: text("href").notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [index("notifications_user").on(t.userId, t.readAt, t.createdAt)],
);

/**
 * Comments on slides. A thread is a root comment (parent null) and its replies; a root may be pinned to a
 * point ({x,y}) or an area ({x,y,w,h}) of the slide, in fractions of its width/height. Anyone who can open
 * the deck can comment. Resolving hides the thread behind "Show resolved".
 */
export type CommentAnchor = { x: number; y: number; w?: number; h?: number };
export const deckComments = pgTable(
  "deck_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: text("deck_id").notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    slideId: text("slide_id").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => deckComments.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }), // null in local development without sign-in
    body: text("body").notNull(),
    anchor: jsonb("anchor").$type<CommentAnchor>(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [index("deck_comments_slide").on(t.deckId, t.slideId, t.createdAt)],
);

/**
 * Studio (src/lib/studio.ts): people with Studio access ask for a new layout or theme; Claude builds it as a
 * proposal in code (src/studio/proposals.ts) and the requester approves, asks for changes or rejects it.
 * A request is open until a proposal answers it.
 */
export const studioRequests = pgTable(
  "studio_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // "layout" | "theme"
    prompt: text("prompt").notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    closedAt: timestamp("closed_at", { withTimezone: true }), // dismissed by the author, or answered
    createdAt: created(),
  },
  (t) => [index("studio_requests_open").on(t.closedAt, t.createdAt)],
);

/** Decisions on a proposal, newest wins. `revision` is the proposal's revision when decided: a newer one reopens it. */
/**
 * UI library: which Figma source a coded component treats as canonical, and which are retired (src/ui/registry.ts
 * declares every source a component has been matched to; decisions made on /ui/library override their status).
 * One row per (component, source); the newest row per pair wins.
 */
export const uiSourceDecisions = pgTable(
  "ui_source_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    componentId: text("component_id").notNull(), // registry id, e.g. "tag"
    sourceKey: text("source_key").notNull(), // library|set|key (src/lib/ui-sources.ts)
    status: text("status").notNull(), // "canonical" | "candidate" | "retired"
    note: text("note"),
    byId: uuid("by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => [index("ui_source_decisions_component").on(t.componentId, t.createdAt)],
);

export const studioDecisions = pgTable(
  "studio_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: text("proposal_id").notNull(),
    revision: integer("revision").notNull(),
    decision: text("decision").notNull(), // "approved" | "changes_requested" | "rejected"
    note: text("note"),
    byId: uuid("by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => [index("studio_decisions_proposal").on(t.proposalId, t.createdAt)],
);

/** Images attached to a Studio decision (pasted or dropped into the note), resized in the browser. Base64. */
export const studioAttachments = pgTable(
  "studio_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    decisionId: uuid("decision_id").notNull().references(() => studioDecisions.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    data: text("data").notNull(),
    createdAt: created(),
  },
  (t) => [index("studio_attachments_decision").on(t.decisionId)],
);
