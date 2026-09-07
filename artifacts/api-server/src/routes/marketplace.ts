import { Router, type IRouter } from "express";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
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

const freshProducts = [
  {
    name: "Fresh Rui Fish — কাটিংসহ",
    category: "fresh-market",
    price: "650",
    originalPrice: "720",
    discount: 10,
    rating: "4.8",
    reviews: 94,
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&q=85",
    seller: "আজকের বাজার",
    badge: "মাছ",
    stock: 35,
    description: "আজকের টাটকা রুই মাছ, পরিষ্কার করে আপনার পছন্দমতো কাটিংসহ পৌঁছে যাবে।",
  },
  {
    name: "দেশি ইলিশ মাছ",
    category: "fresh-market",
    price: "1450",
    originalPrice: "1650",
    discount: 12,
    rating: "4.9",
    reviews: 61,
    image: "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&q=85",
    seller: "নদীর ঘাট",
    badge: "মাছ",
    stock: 18,
    description: "নির্বাচিত দেশি ইলিশ, বরফে সংরক্ষণ করে দ্রুত ডেলিভারি।",
  },
  {
    name: "দেশি ব্রয়লার চিকেন",
    category: "fresh-market",
    price: "330",
    originalPrice: "370",
    discount: 11,
    rating: "4.7",
    reviews: 83,
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=85",
    seller: "Farm Fresh BD",
    badge: "মাংস",
    stock: 42,
    description: "সকালের fresh chicken, পরিষ্কার করে ৮ পিস বা আপনার পছন্দমতো কাটিং।",
  },
  {
    name: "নতুন আলু — ১ কেজি",
    category: "fresh-market",
    price: "55",
    originalPrice: "65",
    discount: 15,
    rating: "4.8",
    reviews: 128,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=85",
    seller: "সবুজ ঝুড়ি",
    badge: "আলু-পেঁয়াজ",
    stock: 120,
    description: "দেশি নতুন আলু, বাছাই করা ও মাটি পরিষ্কার করা।",
  },
  {
    name: "দেশি পেঁয়াজ — ১ কেজি",
    category: "fresh-market",
    price: "95",
    originalPrice: "110",
    discount: 14,
    rating: "4.7",
    reviews: 117,
    image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=800&q=85",
    seller: "সবুজ ঝুড়ি",
    badge: "আলু-পেঁয়াজ",
    stock: 98,
    description: "তাজা দেশি পেঁয়াজ, প্রতিদিনের রান্নার জন্য perfect choice।",
  },
  {
    name: "টাটকা টমেটো — ৫০০ গ্রাম",
    category: "fresh-market",
    price: "80",
    originalPrice: "95",
    discount: 16,
    rating: "4.6",
    reviews: 72,
    image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=800&q=85",
    seller: "কৃষকের হাট",
    badge: "শাকসবজি",
    stock: 75,
    description: "লাল, পাকা ও টাটকা টমেটো—সালাদ, ভর্তা বা রান্নার জন্য।",
  },
  {
    name: "মিশ্র সবজি ঝুড়ি",
    category: "fresh-market",
    price: "220",
    originalPrice: "270",
    discount: 19,
    rating: "4.9",
    reviews: 88,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=85",
    seller: "কৃষকের হাট",
    badge: "শাকসবজি",
    stock: 46,
    description: "গাজর, ফুলকপি, বরবটি, বেগুন ও ক্যাপসিকামের fresh family pack।",
  },
  {
    name: "লাল শাক — ২ আঁটি",
    category: "fresh-market",
    price: "35",
    originalPrice: "45",
    discount: 22,
    rating: "4.8",
    reviews: 69,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=85",
    seller: "কৃষকের হাট",
    badge: "শাকসবজি",
    stock: 65,
    description: "সকালে তোলা নরম লাল শাক, পুষ্টিকর ও রান্নার জন্য ready।",
  },
  {
    name: "মসুর ডাল — ১ কেজি",
    category: "fresh-market",
    price: "160",
    originalPrice: "180",
    discount: 11,
    rating: "4.8",
    reviews: 104,
    image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&q=85",
    seller: "ঘরের বাজার",
    badge: "ডাল ও শস্য",
    stock: 84,
    description: "বাছাই করা মসুর ডাল, পরিষ্কার ও প্রতিদিনের রান্নার উপযোগী।",
  },
  {
    name: "মুগ ডাল — ৫০০ গ্রাম",
    category: "fresh-market",
    price: "190",
    originalPrice: "215",
    discount: 12,
    rating: "4.7",
    reviews: 58,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85",
    seller: "ঘরের বাজার",
    badge: "ডাল ও শস্য",
    stock: 71,
    description: "হালকা ও সুস্বাদু মুগ ডাল, খিচুড়ি ও ডালের জন্য perfect।",
  },
  {
    name: "গুঁড়া জিরা — ২০০ গ্রাম",
    category: "fresh-market",
    price: "120",
    originalPrice: "145",
    discount: 17,
    rating: "4.9",
    reviews: 76,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85",
    seller: "মসলা ঘর",
    badge: "মসলা ও পেস্ট",
    stock: 60,
    description: "সুগন্ধি ভাজা জিরা গুঁড়া, airtight pack-এ fresh রাখা হয়।",
  },
  {
    name: "আদা-রসুন পেস্ট — ২৫০ গ্রাম",
    category: "fresh-market",
    price: "180",
    originalPrice: "210",
    discount: 14,
    rating: "4.8",
    reviews: 91,
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=85",
    seller: "মসলা ঘর",
    badge: "মসলা ও পেস্ট",
    stock: 52,
    description: "তাজা আদা ও রসুনের smooth paste, রান্নার সময় বাঁচাতে ready।",
  },
];

const seedCategories = [
  { id: "electronics", name: "Electronics", nameBn: "ইলেকট্রনিক্স", icon: "⌁", count: 248 },
  { id: "fashion", name: "Fashion", nameBn: "ফ্যাশন", icon: "◌", count: 412 },
  { id: "home", name: "Home & Living", nameBn: "হোম & লিভিং", icon: "⌂", count: 187 },
  { id: "beauty", name: "Beauty", nameBn: "বিউটি", icon: "✦", count: 126 },
  { id: "groceries", name: "Groceries", nameBn: "গ্রোসারি", icon: "◒", count: 309 },
  { id: "fresh-market", name: "Fresh Market", nameBn: "কাঁচা বাজার", icon: "◒", count: freshProducts.length },
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
      if (!existing.length) {
        await db.insert(categoriesTable).values(seedCategories);
        const productsResult = await db.insert(productsTable).values(seedProducts);
        const firstProductId = Number(productsResult[0]?.insertId ?? 1);
        const productIdMap = new Map<number, number>();
        seedProducts.forEach((_, idx) => productIdMap.set(idx + 1, firstProductId + idx));
        await db.insert(reviewsTable).values(
          seedReviews.map((review) => ({
            ...review,
            productId: productIdMap.get(review.productId) ?? firstProductId,
          })),
        );
        await db.insert(productsTable).values(freshProducts);
        logger.info("Seeded BazarHub marketplace catalog");
        return;
      }

      const categoryRows = await db.select({ id: categoriesTable.id }).from(categoriesTable);
      const categoryIds = new Set(categoryRows.map((category) => category.id));
      const missingCategories = seedCategories.filter((category) => !categoryIds.has(category.id));
      if (missingCategories.length) await db.insert(categoriesTable).values(missingCategories);

      const freshExisting = await db.select({ id: productsTable.id }).from(productsTable)
        .where(eq(productsTable.category, "fresh-market"))
        .limit(1);
      if (!freshExisting.length) {
        await db.insert(productsTable).values(freshProducts);
        logger.info("Added fresh market catalog to BazarHub");
      }
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
  if (q) filters.push(or(like(productsTable.name, `%${q}%`), like(productsTable.description, `%${q}%`)));
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
  // If the request is authenticated, link the order to the user.
  const userId = req.user?.id ?? null;
  await db.insert(ordersTable).values({
    id,
    status: "Processing",
    total: total.toFixed(2),
    createdAt,
    userId,
    customerName,
    phone,
    address,
    paymentMethod,
  });
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