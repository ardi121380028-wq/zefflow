import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * SKEMA MULTI-TENANT
 *
 *   auth.users ──1:1── profiles
 *        │
 *        └──< memberships >── workspaces (= tenant / perusahaan)
 *                                  │
 *                                  └──< flows (diagram swimlane)
 *
 * Aturan emas: setiap tabel domain membawa `workspace_id`.
 * Isolasi data ditegakkan oleh RLS (lihat drizzle/rls/001_rls.sql).
 */

// Tabel milik Supabase Auth — hanya direferensikan, tidak dimigrasi.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", { id: uuid("id").primaryKey() });

export const memberRole = pgEnum("member_role", ["owner", "admin", "editor", "viewer"]);
export const flowKind = pgEnum("flow_kind", ["sop", "journey", "architect"]);
export const flowStatus = pgEnum("flow_status", ["draft", "published", "archived"]);
export const planTier = pgEnum("plan_tier", ["free", "pro", "business"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Profil publik pengguna (dibuat otomatis via trigger saat signup). */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    ...timestamps,
  },
  (t) => [index("profiles_email_idx").on(t.email)],
);

/** Tenant. Satu pengguna dapat tergabung di banyak workspace. */
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: planTier("plan").notNull().default("free"),
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("workspaces_slug_uq").on(t.slug)],
);

/** Relasi N:M user <-> workspace beserta perannya. */
export const memberships = pgTable(
  "memberships",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("editor"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index("memberships_user_idx").on(t.userId),
    index("memberships_ws_created_idx").on(t.workspaceId, t.createdAt),
  ],
);

/** Diagram swimlane. `document` = JSON {nodes, edges} tervalidasi Zod di aplikasi. */
export const flows = pgTable(
  "flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled flow"),
    description: text("description"),
    kind: flowKind("kind").notNull().default("sop"),
    status: flowStatus("status").notNull().default("draft"),
    document: jsonb("document")
      .notNull()
      .default(sql`'{"version":1,"nodes":[],"edges":[]}'::jsonb`),
    /** Optimistic concurrency: naik 1 setiap simpan; cegah overwrite diam-diam. */
    version: integer("version").notNull().default(1),
    /** Link view-only: token acak + saklar on/off. */
    shareToken: text("share_token"),
    shareEnabled: boolean("share_enabled").notNull().default(false),
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("flows_workspace_updated_idx").on(t.workspaceId, t.updatedAt),
    uniqueIndex("flows_share_token_uq").on(t.shareToken),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type FlowRow = typeof flows.$inferSelect;
export type MemberRole = (typeof memberRole.enumValues)[number];
