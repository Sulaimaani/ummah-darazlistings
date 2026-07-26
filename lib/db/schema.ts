import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    clerkIdIdx: index("users_clerk_id_idx").on(table.clerkId),
  })
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkId, { onDelete: "cascade" }),
    inputTitles: jsonb("input_titles").$type<string[]>().notNull(),
    seoTitle: text("seo_title").notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("listings_user_id_idx").on(table.userId),
    createdAtIdx: index("listings_created_at_idx").on(table.createdAt),
  })
);

export const galleries = pgTable(
  "galleries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkId, { onDelete: "cascade" }),
    sourceImageKeys: jsonb("source_image_keys").$type<string[]>().notNull(),
    generatedImageKeys: jsonb("generated_image_keys").$type<string[]>().notNull(),
    productName: text("product_name").notNull(),
    logoImageKey: text("logo_image_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    galleryUserIdIdx: index("galleries_user_id_idx").on(table.userId),
    galleryCreatedAtIdx: index("galleries_created_at_idx").on(table.createdAt),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Gallery = typeof galleries.$inferSelect;
export type NewGallery = typeof galleries.$inferInsert;
