/**
 * Test-only helper: spin up an in-memory better-sqlite3 database with the
 * same schema as the production MySQL marketplace tables, and pre-seed it
 * with a compact but representative dataset.
 *
 * Returns a drizzle handle plus the schema objects the api-server route
 * imports from `@workspace/db`, so a test can `vi.mock("@workspace/db", ...)`
 * and have the route code talk to a real database.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  categoriesTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  reviewsTable,
} from "../schema/schema.sqlite.js";
import * as schema from "../schema/schema.sqlite.js";

export interface TestDb {
  /** Drizzle handle bound to the in-memory SQLite DB. */
  db: ReturnType<typeof drizzle<typeof schema>>;
  /** Raw better-sqlite3 handle — useful for direct reads / reset. */
  raw: Database.Database;
  /** Re-exported schema tables. */
  schema: typeof schema;
  /** Drop everything and re-seed. */
  reset: () => void;
  /** Close the DB and free memory. */
  close: () => void;
}

const SEED_CATEGORIES = [
  { id: "electronics", name: "Electronics", nameBn: "ইলেকট্রনিক্স", icon: "⌁", count: 2 },
  { id: "fashion", name: "Fashion", nameBn: "ফ্যাশন", icon: "◌", count: 1 },
  { id: "home", name: "Home & Living", nameBn: "হোম & লিভিং", icon: "⌂", count: 1 },
  { id: "groceries", name: "Groceries", nameBn: "গ্রোসারি", icon: "◒", count: 1 },
  { id: "fresh-market", name: "Fresh Market", nameBn: "কাঁচা বাজার", icon: "◒", count: 3 },
  { id: "lifestyle", name: "Lifestyle", nameBn: "লাইফস্টাইল", icon: "◎", count: 1 },
];

interface SeedProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  discount: number;
  rating: string;
  reviews: number;
  badge: string;
  stock: number;
  description: string;
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "electronics",
    price: "2890",
    originalPrice: "4990",
    discount: 42,
    rating: "4.8",
    reviews: 126,
    badge: "Best Seller",
    stock: 42,
    description: "Noise cancelling, all-day fit.",
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    category: "electronics",
    price: "2190",
    originalPrice: "3490",
    discount: 37,
    rating: "4.5",
    reviews: 146,
    badge: "Flash Sale",
    stock: 31,
    description: "Track steps, sleep, heart rate.",
  },
  {
    id: 3,
    name: "Cotton Panjabi",
    category: "fashion",
    price: "1290",
    originalPrice: "1890",
    discount: 32,
    rating: "4.7",
    reviews: 89,
    badge: "Trending",
    stock: 18,
    description: "Breathable premium cotton.",
  },
  {
    id: 4,
    name: "Ceramic Coffee Set",
    category: "home",
    price: "940",
    originalPrice: "1450",
    discount: 35,
    rating: "4.9",
    reviews: 57,
    badge: "Top Rated",
    stock: 24,
    description: "Hand-finished ceramic set.",
  },
  {
    id: 5,
    name: "Organic Honey",
    category: "groceries",
    price: "750",
    originalPrice: "980",
    discount: 23,
    rating: "4.9",
    reviews: 312,
    badge: "Verified",
    stock: 90,
    description: "Raw, unfiltered Sundarbans honey.",
  },
  {
    id: 6,
    name: "Fresh Rui Fish",
    category: "fresh-market",
    price: "650",
    originalPrice: "720",
    discount: 10,
    rating: "4.8",
    reviews: 94,
    badge: "মাছ",
    stock: 35,
    description: "আজকের টাটকা রুই মাছ।",
  },
  {
    id: 7,
    name: "Deshi Chicken",
    category: "fresh-market",
    price: "330",
    originalPrice: "370",
    discount: 11,
    rating: "4.7",
    reviews: 83,
    badge: "মাংস",
    stock: 42,
    description: "সকালের fresh chicken।",
  },
  {
    id: 8,
    name: "Mixed Veg Basket",
    category: "fresh-market",
    price: "220",
    originalPrice: "270",
    discount: 19,
    rating: "4.9",
    reviews: 88,
    badge: "শাকসবজি",
    stock: 46,
    description: "Mixed vegetable family pack.",
  },
  {
    id: 9,
    name: "Portable Blender",
    category: "lifestyle",
    price: "1180",
    originalPrice: "1590",
    discount: 26,
    rating: "4.4",
    reviews: 61,
    badge: "New",
    stock: 29,
    description: "USB rechargeable blender bottle.",
  },
];

const SEED_REVIEWS = [
  { productId: 1, author: "Nusrat J.", rating: 5, reviewText: "Excellent sound, fast delivery.", reviewDate: "2 days ago" },
  { productId: 1, author: "Rakib H.", rating: 4, reviewText: "Great value for the price.", reviewDate: "1 week ago" },
  { productId: 3, author: "Maliha A.", rating: 5, reviewText: "Fabric is soft and the fit is perfect.", reviewDate: "3 days ago" },
];

function createSchema(raw: Database.Database) {
  raw.exec(`
    CREATE TABLE marketplace_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      icon TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE marketplace_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      rating TEXT NOT NULL DEFAULT '0',
      reviews INTEGER NOT NULL DEFAULT 0,
      image TEXT NOT NULL,
      seller TEXT NOT NULL,
      badge TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE marketplace_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      review_date TEXT NOT NULL
    );
    CREATE TABLE marketplace_orders (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      total TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      payment_method TEXT NOT NULL
    );
    CREATE TABLE marketplace_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );
  `);
}

function insertSeed(db: ReturnType<typeof drizzle<typeof schema>>) {
  db.insert(categoriesTable).values(SEED_CATEGORIES).run();
  db.insert(productsTable).values(
    SEED_PRODUCTS.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      originalPrice: Number(product.originalPrice),
      discount: product.discount,
      rating: product.rating,
      reviews: product.reviews,
      image: `https://example.com/${product.id}.jpg`,
      seller: "Test Seller",
      badge: product.badge,
      stock: product.stock,
      description: product.description,
    })),
  ).run();
  db.insert(reviewsTable).values(SEED_REVIEWS).run();
}

export function createTestDb(): TestDb {
  const raw = new Database(":memory:");
  createSchema(raw);
  const db = drizzle(raw, { schema });
  insertSeed(db);

  return {
    db,
    raw,
    schema,
    reset() {
      raw.exec(`
        DELETE FROM marketplace_order_items;
        DELETE FROM marketplace_orders;
        DELETE FROM marketplace_reviews;
        DELETE FROM marketplace_products;
        DELETE FROM marketplace_categories;
      `);
      insertSeed(db);
    },
    close() {
      raw.close();
    },
  };
}

export const TEST_TABLES = {
  categoriesTable,
  productsTable,
  reviewsTable,
  ordersTable,
  orderItemsTable,
};
