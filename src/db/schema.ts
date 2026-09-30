import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 120 }).notNull(),
    shortDescription: varchar("short_description", { length: 300 }).notNull(),
    description: text("description").notNull(),
    techStack: text("tech_stack").array().notNull().default([]),
    thumbnailUrl: text("thumbnail_url"),
    projectUrl: text("project_url"),
    repoUrl: text("repo_url"),
    signOrder: integer("sign_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("projects_sign_order_idx").on(table.signOrder)],
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  message: varchar("message", { length: 5000 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
