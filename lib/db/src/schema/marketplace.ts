import { createInsertSchema } from "drizzle-zod";
import {
  int,
  mysqlTable,
  serial,
  text,
  timestamp,
  decimal,
  varchar,
} from "drizzle-orm/mysql-core";
import { z } from "zod/v4";

export const categoriesTable = mysqlTable("marketplace_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  icon: text("icon").notNull(),
  count: int("count").notNull().default(0),
});

export const productsTable = mysqlTable("marketplace_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 12, scale: 2 }).notNull(),
  discount: int("discount").notNull().default(0),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  reviews: int("reviews").notNull().default(0),
  image: text("image").notNull(),
  seller: text("seller").notNull(),
  badge: text("badge").notNull().default(""),
  stock: int("stock").notNull().default(0),
  description: text("description").notNull().default(""),
});

export const reviewsTable = mysqlTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  author: text("author").notNull(),
  rating: int("rating").notNull(),
  reviewText: text("review_text").notNull(),
  reviewDate: text("review_date").notNull(),
});

export const ordersTable = mysqlTable("marketplace_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  status: text("status").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Optional FK to marketplace_users.id; null for guest checkout.
  userId: int("user_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull(),
});

export const orderItemsTable = mysqlTable("marketplace_order_items", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  productId: int("product_id").notNull(),
  quantity: int("quantity").notNull(),
});

export const usersTable = mysqlTable("marketplace_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  // One of: 'shopper' | 'seller' | 'admin'.
  role: text("role").notNull().default("shopper"),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessionsTable = mysqlTable("marketplace_sessions", {
  id: text("id").primaryKey(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  userId: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
});

export const orderItemInputSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
});

export type Category = typeof categoriesTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
