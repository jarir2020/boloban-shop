import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import {
  categoriesTable,
  db,
  orderItemsTable,
  ordersTable,
  productsTable,
  reviewsTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  GetProductParams,
  ListOrdersResponse,
  ListProductReviewsParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const seedProducts = [
  {
    name: "Wireless Noise Cancelling Headphones",
    category: "electronics",
    price: "2890",
    originalPrice: "4990",
    discount: 42,
    rating: "4.8",
    reviews: 126,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85",
    seller: "Tech Valley",
    badge: "Best Seller",
    stock: 42,
    description: "Immersive sound, comfortable all-day fit, and up to 30 hours of battery life.",
  },
  {
    name: "Premium Cotton Panjabi",
    category: "fashion",
    price: "1290",
    originalPrice: "1890",
    discount: 32,
    rating: "4.7",
    reviews: 89,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=85",
    seller: "Deshi Threads",
    badge: "Trending",
    stock: 18,
    description: "Breathable premium cotton panjabi with a relaxed cut for Eid, events, and everyday wear.",
  },
  {
    name: "Minimal Ceramic Coffee Set",
    category: "home",
    price: "940",
    originalPrice: "1450",
    discount: 35,
    rating: "4.9",
    reviews: 57,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=85",
    seller: "Clay & Craft",
    badge: "Top Rated",
    stock: 24,
    description: "Hand-finished ceramic set for slow mornings, including two cups and a serving tray.",
  },
  {
    name: "Everyday Skincare Essentials",
    category: "beauty",
    price: "1680",
    originalPrice: "2350",
    discount: 29,
    rating: "4.6",
    reviews: 203,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&q=85",
    seller: "Glow Basket",
    badge: "Popular",
    stock: 67,
    description: "A gentle daily routine with cleanser, moisturizer, and SPF for a healthy glow.",
  },
  {
    name: "Smart Fitness Watch",
    category: "electronics",
    price: "2190",
    originalPrice: "3490",
    discount: 37,
    rating: "4.5",
    reviews: 146,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85",
    seller: "Gadget Grove",
    badge: "Flash Sale",
    stock: 31,
    description: "Track your steps, sleep, heart rate, and workouts with a bright all-day display.",
  },
  {
    name: "Woven Jute Tote Bag",
    category: "fashion",
    price: "590",
    originalPrice: "890",
    discount: 34,
    rating: "4.8",
    reviews: 74,
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&q=85",
    seller: "Nokshi Studio",
    badge: "Made in BD",
    stock: 51,
    description: "A sturdy, reusable everyday tote made from locally sourced jute.",
  },
  {
    name: "Organic Honey — Sundarbans",
    category: "groceries",
    price: "750",
    originalPrice: "980",
    discount: 23,
    rating: "4.9",
    reviews: 312,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=85",
    seller: "Pure Harvest",
    badge: "Verified",
    stock: 90,
    description: "Raw, unfiltered honey sourced from trusted beekeepers near the Sundarbans.",
  },
  {
    name: "Portable Blender Bottle",
    category: "lifestyle",
    price: "1180",
    originalPrice: "1590",
    discount: 26,
    rating: "4.4",
    reviews: 61,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=85",
    seller: "Daily Goods",
    badge: "New",
    stock: 29,
    description: "USB rechargeable blender bottle for smoothies at home, work, or the gym.",
  },
];

const seedCategories = [
  { id: "electronics", name: "Electronics", nameBn: "ইলেকট্রনিক্স", icon: "⌁", count: 248 },
  { id: "fashion", name: "Fashion", nameBn: "ফ্যাশন", icon: "◌", count: 412 },
  { id: "home", name: "Home & Living", nameBn: "হোম & লিভিং", icon: "⌂", count: 187 },
  { id: "beauty", name: "Beauty", nameBn: "বিউটি", icon: "✦", count: 126 },
  { id: "groceries", name: "Groceries", nameBn: "গ্রোসারি", icon: "◒", count: 309 },
  { id: "lifestyle", name: "Lifestyle", nameBn: "লাইফস্টাইল", icon: "◎", count: 154 },
];

const seedReviews = [
  { productId: 1, author: "Nusrat Jahan", rating: 5, reviewText: "Sound quality is excellent and delivery was surprisingly fast.", reviewDate: "2 days ago" },
  { productId: 1, author: "Rakib Hasan", rating: 4, reviewText: "Great value for the price. Comfortable for long calls.", reviewDate: "1 week ago" },
  { productId: 2, author: "Maliha Ahmed", rating: 5, reviewText: "The fabric is soft and the fit is exactly as pictured.", reviewDate: "3 days ago" },
  { productId: 7, author: "Farhan Kabir", rating: 5, reviewText: "Authentic taste and nicely packed. Will order again.", reviewDate: "5 days ago" },
];

let seedPromise: Promise<void> | undefined;
function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: productsTable.id }).from(productsTable).limit(1);
      if (existing.length) return;
      await db.insert(categoriesTable).values(seedCategories);
      const inserted = await db.insert(productsTable).values(seedProducts).returning({ id: productsTable.id });
      await db.insert(reviewsTable).values(
        seedReviews.map((review) => ({ ...review, productId: inserted[review.productId - 1]?.id ?? inserted[0].id })),
      );
      logger.info("Seeded BazarHub marketplace catalog");
    })().catch((error) => {
      seedPromise = undefined;
      logger.error({ error }, "Could not seed marketplace catalog");
      throw error;
    });
  }
  return seedPromise;
}

function productDto(product: typeof productsTable.$inferSelect) {
  return {
    ...product,
    price: Number(product.price),
    originalPrice: Number(product.originalPrice),
    rating: Number(product.rating),
  };
}

router.get("/categories", async (_req, res) => {
  await ensureSeeded();
  const rows = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name));
  res.json(rows);
});

router.get("/products", async (req, res) => {
  await ensureSeeded();
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product filters" });
    return;
  }
  const { q, category, sort, limit } = parsed.data;
  const filters = [];
  if (q) filters.push(or(ilike(productsTable.name, `%${q}%`), ilike(productsTable.description, `%${q}%`)));
  if (category) filters.push(eq(productsTable.category, category));
  let query = db.select().from(productsTable);
  if (filters.length) query = query.where(and(...filters)) as typeof query;
  if (sort === "price_asc") query = query.orderBy(asc(productsTable.price)) as typeof query;
  else if (sort === "price_desc") query = query.orderBy(desc(productsTable.price)) as typeof query;
  else if (sort === "rating") query = query.orderBy(desc(productsTable.rating)) as typeof query;
  else query = query.orderBy(desc(productsTable.reviews)) as typeof query;
  const rows = await query.limit(limit);
  res.json(rows.map(productDto));
});

router.get("/products/:id", async (req, res) => {
  await ensureSeeded();
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(productDto(product));
});

router.get("/products/:id/reviews", async (req, res) => {
  await ensureSeeded();
  const parsed = ListProductReviewsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const rows = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, parsed.data.id)).orderBy(desc(reviewsTable.id));
  res.json(rows.map(({ id, author, rating, reviewText, reviewDate }) => ({ id, author, rating, text: reviewText, date: reviewDate })));
});

router.get("/deals", async (_req, res) => {
  await ensureSeeded();
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.discount)).limit(6);
  res.json(rows.map(productDto));
});

router.post("/orders", async (req, res) => {
  await ensureSeeded();
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please complete all checkout fields" });
    return;
  }
  const { items, customerName, phone, address, paymentMethod } = parsed.data;
  const ids = items.map((item) => item.productId);
  const products = await db.select().from(productsTable).where(or(...ids.map((id) => eq(productsTable.id, id))));
  const byId = new Map(products.map((product) => [product.id, product]));
  if (products.length !== new Set(ids).size) {
    res.status(400).json({ error: "One or more products are unavailable" });
    return;
  }
  const total = items.reduce((sum, item) => sum + Number(byId.get(item.productId)!.price) * item.quantity, 0);
  const id = `BH-${Math.floor(Date.now() / 1000).toString(36).toUpperCase()}`;
  const createdAt = new Date();
  await db.insert(ordersTable).values({ id, status: "Processing", total: total.toFixed(2), createdAt, customerName, phone, address, paymentMethod });
  await db.insert(orderItemsTable).values(items.map((item) => ({ orderId: id, productId: item.productId, quantity: item.quantity })));
  res.status(201).json({ id, status: "Processing", items, total, createdAt: createdAt.toISOString(), customerName, phone, address, paymentMethod });
});

router.get("/orders", async (_req, res) => {
  await ensureSeeded();
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(20);
  const orderIds = orders.map((order) => order.id);
  const items = orderIds.length
    ? await db.select().from(orderItemsTable).where(or(...orderIds.map((id) => eq(orderItemsTable.orderId, id))))
    : [];
  const result = orders.map((order) => ({
    id: order.id,
    status: order.status,
    items: items.filter((item) => item.orderId === order.id).map(({ productId, quantity }) => ({ productId, quantity })),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    paymentMethod: order.paymentMethod,
  }));
  res.json(ListOrdersResponse.parse(result));
});

export default router;