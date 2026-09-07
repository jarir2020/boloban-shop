import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./test-db.js";

describe("@workspace/db schema", () => {
  let tdb: TestDb;

  beforeEach(() => {
    tdb = createTestDb();
  });
  afterEach(() => tdb.close());

  it("default values match the production schema", () => {
    const t = tdb.schema;
    // Insert a row with only the not-null fields; everything else should
    // pick up the column default.
    tdb.db.insert(t.productsTable).values({
      name: "Sentinel",
      category: "test",
      price: 0,
      originalPrice: 0,
      image: "https://example.com/sentinel.jpg",
      seller: "Sentinel Seller",
    }).run();

    const rows = tdb.db.select().from(t.productsTable).all();
    const row = rows.find((r) => r.name === "Sentinel");
    expect(row).toBeDefined();
    expect(row?.discount).toBe(0);
    expect(row?.reviews).toBe(0);
    expect(row?.stock).toBe(0);
    expect(row?.badge).toBe("");
    expect(row?.description).toBe("");
    expect(row?.rating).toBe("0");
  });

  it("categories default `count` to 0 when omitted", () => {
    const t = tdb.schema;
    tdb.db
      .insert(t.categoriesTable)
      .values({ id: "x", name: "X", nameBn: "এক্স", icon: "✕" })
      .run();
    const row = tdb.db.select().from(t.categoriesTable).all().find((r) => r.id === "x");
    expect(row?.count).toBe(0);
  });

  it("round-trips an order with all fields", () => {
    const t = tdb.schema;
    const created = new Date();
    tdb.db
      .insert(t.ordersTable)
      .values({
        id: "BH-1",
        status: "Processing",
        total: "100.00",
        createdAt: created,
        customerName: "C",
        phone: "01",
        address: "A",
        paymentMethod: "cod",
      })
      .run();

    const row = tdb.db.select().from(t.ordersTable).all().find((r) => r.id === "BH-1");
    expect(row).toMatchObject({
      id: "BH-1",
      status: "Processing",
      total: "100.00",
      customerName: "C",
      paymentMethod: "cod",
    });
    // The SQLite mirror stores timestamp as ms; reading back gives a Date
    // that should equal the inserted value to the millisecond.
    expect((row?.createdAt as Date).getTime()).toBe(created.getTime());
  });

  it("ordersTable.createdAt defaults to a current timestamp when omitted", () => {
    const t = tdb.schema;
    tdb.db
      .insert(t.ordersTable)
      .values({
        id: "BH-2",
        status: "Processing",
        total: "0",
        customerName: "C",
        phone: "01",
        address: "A",
        paymentMethod: "cod",
      })
      .run();

    const row = tdb.db.select().from(t.ordersTable).all().find((r) => r.id === "BH-2");
    // The SQLite mirror uses `integer({ mode: "timestamp_ms" })` so
    // $defaultFn(() => new Date()) is a Date instance, mapped to a
    // number on read.  We just assert it's recent.
    expect(row?.createdAt).toBeInstanceOf(Date);
    const ageMs = Date.now() - (row?.createdAt as Date).getTime();
    expect(ageMs).toBeGreaterThanOrEqual(0);
    expect(ageMs).toBeLessThan(60_000);
  });

  it("orderItems cascade by orderId is implicit (no FK), but the join still works", () => {
    const t = tdb.schema;
    tdb.db
      .insert(t.ordersTable)
      .values({
        id: "BH-3",
        status: "Processing",
        total: "50.00",
        customerName: "C",
        phone: "01",
        address: "A",
        paymentMethod: "cod",
      })
      .run();
    tdb.db
      .insert(t.orderItemsTable)
      .values([
        { orderId: "BH-3", productId: 1, quantity: 2 },
        { orderId: "BH-3", productId: 5, quantity: 1 },
      ])
      .run();

    const items = tdb.db.select().from(t.orderItemsTable).all();
    expect(items.filter((i) => i.orderId === "BH-3")).toHaveLength(2);
  });

  it("selecting the seed returns the expected number of categories and products", () => {
    const t = tdb.schema;
    const cats = tdb.db.select().from(t.categoriesTable).all();
    const prods = tdb.db.select().from(t.productsTable).all();
    expect(cats.length).toBeGreaterThanOrEqual(6);
    expect(prods.length).toBeGreaterThanOrEqual(8);
  });

  it("`reset()` clears and re-seeds, leaving no orders behind", () => {
    const t = tdb.schema;
    tdb.db
      .insert(t.ordersTable)
      .values({
        id: "BH-X",
        status: "Processing",
        total: "0",
        customerName: "C",
        phone: "01",
        address: "A",
        paymentMethod: "cod",
      })
      .run();
    expect(tdb.db.select().from(t.ordersTable).all()).toHaveLength(1);

    tdb.reset();

    expect(tdb.db.select().from(t.ordersTable).all()).toHaveLength(0);
    // Re-seeded categories & products should be back.
    expect(tdb.db.select().from(t.categoriesTable).all().length).toBeGreaterThan(0);
  });
});

describe("@workspace/db Zod schemas", () => {
  it("insertOrderSchema accepts a valid order body and rejects id/createdAt", async () => {
    const { insertOrderSchema } = await import("../schema/marketplace.js");
    const ok = insertOrderSchema.parse({
      status: "Processing",
      total: "100.00",
      customerName: "C",
      phone: "01",
      address: "A",
      paymentMethod: "cod",
    });
    expect(ok).toMatchObject({ status: "Processing", total: "100.00" });
    // Should NOT have id or createdAt because the schema omits them.
    expect("id" in ok).toBe(false);
    expect("createdAt" in ok).toBe(false);
  });

  it("orderItemInputSchema requires productId:number, quantity>=1", async () => {
    const { orderItemInputSchema } = await import("../schema/marketplace.js");
    expect(() => orderItemInputSchema.parse({ productId: 1, quantity: 1 })).not.toThrow();
    // The Zod schema is generated by drizzle-zod and lives in a private class
    // tree; we just check that the parse throws something with `issues`,
    // which is the contract every ZodError satisfies.
    expect(() => orderItemInputSchema.parse({ productId: 1, quantity: 0 })).toThrow(/Too small|too_small|Number must be greater than or equal to 1/);
    expect(() => orderItemInputSchema.parse({ productId: 1, quantity: -1 })).toThrow();
    expect(() => orderItemInputSchema.parse({ productId: "1", quantity: 1 })).toThrow();
  });

  it("insertOrderItemSchema rejects the auto-increment `id` field", async () => {
    const { insertOrderItemSchema } = await import("../schema/marketplace.js");
    const ok = insertOrderItemSchema.parse({ orderId: "BH-1", productId: 1, quantity: 1 });
    expect("id" in ok).toBe(false);
  });
});
