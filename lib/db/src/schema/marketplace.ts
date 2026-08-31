import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const categoriesTable = pgTable("marketplace_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  icon: text("icon").notNull(),
  count: integer("count").notNull().default(0),
});

export const productsTable = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }).notNull(),
  discount: integer("discount").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  reviews: integer("reviews").notNull().default(0),
  image: text("image").notNull(),
  seller: text("seller").notNull(),
  badge: text("badge").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  description: text("description").notNull().default(""),
});

export const reviewsTable = pgTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  reviewDate: text("review_date").notNull(),
});

export const ordersTable = pgTable("marketplace_orders", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull(),
});

export const orderItemsTable = pgTable("marketplace_order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
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