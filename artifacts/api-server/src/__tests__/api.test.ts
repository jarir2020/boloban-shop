import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getRequest, resetTestDb, closeTestDb } from "./setup-app.js";

let request: Awaited<ReturnType<typeof getRequest>>;

beforeAll(async () => {
  request = await getRequest();
});
afterAll(() => closeTestDb());
beforeEach(() => resetTestDb());

describe("GET /api/healthz", () => {
  it("returns ok", async () => {
    const res = await request.get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/categories", () => {
  it("returns all seeded categories sorted by name", async () => {
    const res = await request.get("/api/categories");
    expect(res.status).toBe(200);
    const names: string[] = res.body.map((c: { name: string }) => c.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
    for (const cat of res.body) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("nameBn");
      expect(cat).toHaveProperty("icon");
      expect(typeof cat.count).toBe("number");
    }
  });

  it("is idempotent (no duplicate rows on second call)", async () => {
    const first = await request.get("/api/categories");
    const second = await request.get("/api/categories");
    expect(second.body.length).toBe(first.body.length);
    const firstIds = first.body.map((c: { id: string }) => c.id).sort();
    const secondIds = second.body.map((c: { id: string }) => c.id).sort();
    expect(secondIds).toEqual(firstIds);
  });
});

describe("GET /api/products", () => {
  it("returns 200 with all products and number-coerced prices", async () => {
    const res = await request.get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const product of res.body) {
      expect(typeof product.price).toBe("number");
      expect(typeof product.originalPrice).toBe("number");
      expect(typeof product.rating).toBe("number");
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it("filters by category=electronics", async () => {
    const res = await request.get("/api/products?category=electronics");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const p of res.body) expect(p.category).toBe("electronics");
  });

  it("filters by category=fresh-market and includes seeded fresh products", async () => {
    const res = await request.get("/api/products?category=fresh-market");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const p of res.body) expect(p.category).toBe("fresh-market");
  });

  it("sort=price_asc orders by price ascending", async () => {
    const res = await request.get("/api/products?sort=price_asc");
    const prices: number[] = res.body.map((p: { price: number }) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it("sort=price_desc orders by price descending", async () => {
    const res = await request.get("/api/products?sort=price_desc");
    const prices: number[] = res.body.map((p: { price: number }) => p.price);
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  it("sort=rating orders by rating descending", async () => {
    const res = await request.get("/api/products?sort=rating");
    const ratings: number[] = res.body.map((p: { rating: number }) => p.rating);
    for (let i = 0; i < ratings.length - 1; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
    }
  });

  it("default sort orders by reviews (popular) descending", async () => {
    const res = await request.get("/api/products");
    const reviews: number[] = res.body.map((p: { reviews: number }) => p.reviews);
    for (let i = 0; i < reviews.length - 1; i++) {
      expect(reviews[i]).toBeGreaterThanOrEqual(reviews[i + 1]);
    }
  });

  it("q=honey matches product names by substring", async () => {
    const res = await request.get("/api/products?q=honey");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const p of res.body) {
      const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
      expect(haystack).toContain("honey");
    }
  });

  it("q= (empty) returns all products (no filter applied)", async () => {
    const all = await request.get("/api/products");
    const empty = await request.get("/api/products?q=");
    expect(empty.body.length).toBe(all.body.length);
  });

  it("limit=3 returns at most 3 items", async () => {
    const res = await request.get("/api/products?limit=3");
    expect(res.body.length).toBeLessThanOrEqual(3);
  });

  it("limit=foo is rejected with 400", async () => {
    const res = await request.get("/api/products?limit=foo");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/products/:id", () => {
  it("returns the product DTO when it exists", async () => {
    const res = await request.get("/api/products/1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: expect.any(String) });
    expect(typeof res.body.price).toBe("number");
  });

  it("returns 404 for an unknown product", async () => {
    const res = await request.get("/api/products/99999");
    expect(res.status).toBe(404);
  });

  it("returns 400 when the id is not numeric", async () => {
    const res = await request.get("/api/products/abc");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/products/:id/reviews", () => {
  it("returns reviews for the product", async () => {
    const res = await request.get("/api/products/1/reviews");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const review of res.body) {
      expect(review).toHaveProperty("author");
      expect(review).toHaveProperty("text");
      expect(review).toHaveProperty("date");
      expect(review).toHaveProperty("rating");
    }
  });

  it("returns an empty array for products with no reviews", async () => {
    const res = await request.get("/api/products/99999/reviews");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/deals", () => {
  it("returns at most 6 deals, ordered by discount desc", async () => {
    const res = await request.get("/api/deals");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(6);
    const discounts: number[] = res.body.map((p: { discount: number }) => p.discount);
    for (let i = 0; i < discounts.length - 1; i++) {
      expect(discounts[i]).toBeGreaterThanOrEqual(discounts[i + 1]);
    }
  });
});

describe("GET /api/orders", () => {
  it("returns an empty list when there are no orders", async () => {
    const res = await request.get("/api/orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/orders", () => {
  const validOrder = {
    items: [{ productId: 1, quantity: 2 }],
    customerName: "Test Customer",
    phone: "01700000000",
    address: "House 1, Road 1, Dhaka",
    paymentMethod: "cod" as const,
  };

  it("creates an order and returns 201", async () => {
    const res = await request.post("/api/orders").send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: "Processing",
      customerName: "Test Customer",
      paymentMethod: "cod",
    });
    expect(res.body.id).toMatch(/^BH-/);
    expect(res.body.items).toEqual(validOrder.items);
    // Product 1 price is "2890" → 2890 * 2 = 5780.
    expect(res.body.total).toBe(5780);
    expect(typeof res.body.createdAt).toBe("string");
  });

  it("rejects empty items with 400", async () => {
    const res = await request.post("/api/orders").send({ ...validOrder, items: [] });
    expect(res.status).toBe(400);
  });

  it("rejects unknown productId with 400", async () => {
    const res = await request
      .post("/api/orders")
      .send({ ...validOrder, items: [{ productId: 99999, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unavailable/i);
  });

  it("rejects missing customerName with 400", async () => {
    const { customerName: _ignore, ...rest } = validOrder;
    const res = await request.post("/api/orders").send(rest);
    expect(res.status).toBe(400);
  });

  it("rejects invalid paymentMethod with 400", async () => {
    const res = await request
      .post("/api/orders")
      .send({ ...validOrder, paymentMethod: "stripe" });
    expect(res.status).toBe(400);
  });

  it("after creating an order, GET /api/orders returns it", async () => {
    await request.post("/api/orders").send(validOrder);
    const list = await request.get("/api/orders");
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
    const order = list.body[0];
    expect(order).toMatchObject({
      status: "Processing",
      customerName: "Test Customer",
    });
    expect(order.items).toEqual(validOrder.items);
    expect(order.total).toBe(5780);
  });

  it("sums multiple items into a single total", async () => {
    const res = await request
      .post("/api/orders")
      .send({
        ...validOrder,
        items: [
          { productId: 1, quantity: 1 }, // 2890
          { productId: 5, quantity: 2 }, // 750 * 2 = 1500
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(2890 + 1500);
  });
});
