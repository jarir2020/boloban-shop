/**
 * Test-only SQLite mirror of the production MySQL schema in marketplace.ts.
 *
 * The route code in artifacts/api-server/src/routes/marketplace.ts uses
 * drizzle in a dialect-agnostic way (`eq`, `or`, `and`, `like`, `asc`, `desc`
 * and the basic `select().from().where().orderBy().limit()` /
 * `insert(table).values(...)` shapes).  The product rows come back as plain
 * objects whose `price` / `rating` / `originalPrice` fields are
 * `Number()`-coercible strings, matching the production code's expectations.
 *
 * This file exists ONLY so that the api-server can be exercised under
 * `vi.mock("@workspace/db", ...)` against a real better-sqlite3 in-memory
 * database during tests, with no MySQL server required.
 */

import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const categoriesTable = sqliteTable("marketplace_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  icon: text("icon").notNull(),
  count: integer("count").notNull().default(0),
});

export const productsTable = sqliteTable("marketplace_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  // Production uses `decimal(12,2)` (numeric strings); the route calls
  // `Number(product.price)` to coerce. In SQLite we use `real` so the
  // column is genuinely numeric and ORDER BY sorts numerically.
  price: real("price").notNull(),
  originalPrice: real("original_price").notNull(),
  discount: integer("discount").notNull().default(0),
  // Production uses `decimal(3,1)` — keep as text to match the input
  // shape (e.g. "4.8"); the route still calls `Number(...)`.
  rating: text("rating").notNull().default("0"),
  reviews: integer("reviews").notNull().default(0),
  image: text("image").notNull(),
  seller: text("seller").notNull(),
  badge: text("badge").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  description: text("description").notNull().default(""),
});

export const reviewsTable = sqliteTable("marketplace_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  reviewDate: text("review_date").notNull(),
});

export const ordersTable = sqliteTable("marketplace_orders", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  total: text("total").notNull(), // MySQL decimal(12,2) → string
  // Use SQLite integer mode "timestamp_ms" so Date values coming from
  // production code (which always pass `new Date()`) are coerced to a
  // number at the driver boundary. Better-sqlite3 cannot bind a Date
  // object directly; integer mode handles this for us.
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Optional FK to marketplace_users.id. Nullable for guest checkout.
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull(),
});

export const orderItemsTable = sqliteTable("marketplace_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
});

export const usersTable = sqliteTable("marketplace_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("shopper"),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessionsTable = sqliteTable("marketplace_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});
