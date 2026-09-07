// @vitest-environment jsdom
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart, type CartItem } from "@/lib/cart";
import type { Product } from "@workspace/api-client-react";

/**
 * Test harness: a tiny component that exposes the cart context to the
 * outside world via a `data-testid` panel.  We then query the panel to
 * observe cart state, and use the buttons to drive state transitions.
 */

interface PanelState {
  items: CartItem[];
  count: number;
  subtotal: number;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Test Product",
    category: "test",
    price: 100,
    originalPrice: 150,
    discount: 33,
    rating: 4.5,
    reviews: 10,
    image: "https://example.com/p.jpg",
    seller: "Test Seller",
    badge: "",
    stock: 5,
    description: "Test description",
    ...overrides,
  };
}

function CartHost({ initial }: { initial?: CartItem[] }) {
  const cart = useCart();
  return (
    <div>
      <pre data-testid="state" data-items={JSON.stringify(cart.items)} data-count={cart.count} data-subtotal={cart.subtotal} />
      <button data-testid="add-1" onClick={() => cart.addItem(makeProduct({ id: 1 }))}>add-1</button>
      <button data-testid="add-2" onClick={() => cart.addItem(makeProduct({ id: 2, name: "P2", price: 50 }))}>add-2</button>
      <button data-testid="add-2-again" onClick={() => cart.addItem(makeProduct({ id: 2, name: "P2", price: 50 }))}>add-2-again</button>
      <button data-testid="add-low-stock" onClick={() => cart.addItem(makeProduct({ id: 3, name: "P3", price: 30, stock: 2 }))}>add-low-stock</button>
      <button data-testid="add-zero-stock" onClick={() => cart.addItem(makeProduct({ id: 4, name: "P4", price: 20, stock: 0 }))}>add-zero-stock</button>
      <button data-testid="update-1-7" onClick={() => cart.updateQuantity(1, 7)}>update-1-7</button>
      <button data-testid="update-3-0" onClick={() => cart.updateQuantity(3, 0)}>update-3-0</button>
      <button data-testid="update-3-99" onClick={() => cart.updateQuantity(3, 99)}>update-3-99</button>
      <button data-testid="remove-1" onClick={() => cart.removeItem(1)}>remove-1</button>
      <button data-testid="remove-missing" onClick={() => cart.removeItem(99999)}>remove-missing</button>
      <button data-testid="clear" onClick={() => cart.clearCart()}>clear</button>
    </div>
  );
}

function readState(): PanelState {
  const pre = screen.getByTestId("state");
  return {
    items: JSON.parse(pre.getAttribute("data-items") ?? "[]"),
    count: Number(pre.getAttribute("data-count")),
    subtotal: Number(pre.getAttribute("data-subtotal")),
  };
}

const STORAGE_KEY = "bazarhub-cart";

describe("cart lib", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("addItem appends with default quantity 1", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1"));
    const state = readState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe(1);
    expect(state.items[0].quantity).toBe(1);
    expect(state.count).toBe(1);
    expect(state.subtotal).toBe(100);
  });

  it("addItem of an existing product increments quantity (not a duplicate row)", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-2"));
    await user.click(screen.getByTestId("add-2-again"));
    const state = readState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.count).toBe(2);
    expect(state.subtotal).toBe(100); // 50 * 2
  });

  it("addItem caps quantity at product.stock", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-low-stock")); // stock 2 → quantity 1
    await user.click(screen.getByTestId("add-low-stock")); // +1 → quantity 2 (at cap)
    await user.click(screen.getByTestId("add-low-stock")); // +1 → still 2 (capped)
    const state = readState();
    expect(state.items[0].quantity).toBe(2);
    expect(state.count).toBe(2);
  });

  it("addItem of a zero-stock product adds exactly 1", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-zero-stock"));
    const state = readState();
    expect(state.items[0].quantity).toBe(1);
  });

  it("updateQuantity clamps to stock; updateQuantity(0) removes the item", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-low-stock")); // id 3, stock 2
    await user.click(screen.getByTestId("update-3-99")); // should clamp to 2
    expect(readState().items[0].quantity).toBe(2);
    await user.click(screen.getByTestId("update-3-0")); // remove
    expect(readState().items).toHaveLength(0);
  });

  it("updateQuantity accepts arbitrary in-stock values", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1")); // stock 5
    await user.click(screen.getByTestId("update-1-7")); // would clamp to 5
    // (the host above uses id 1; in-cart product was id 1.)
    // The button maps to updateQuantity(1, 7) which clamps to stock=5.
    expect(readState().items[0].quantity).toBe(5);
  });

  it("removeItem deletes by id; idempotent for missing ids", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1"));
    await user.click(screen.getByTestId("add-2"));
    await user.click(screen.getByTestId("remove-missing")); // no-op
    expect(readState().items).toHaveLength(2);
    await user.click(screen.getByTestId("remove-1"));
    expect(readState().items).toHaveLength(1);
    expect(readState().items[0].product.id).toBe(2);
  });

  it("clearCart empties everything; count and subtotal are 0", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1"));
    await user.click(screen.getByTestId("add-2"));
    await user.click(screen.getByTestId("clear"));
    const state = readState();
    expect(state.items).toHaveLength(0);
    expect(state.count).toBe(0);
    expect(state.subtotal).toBe(0);
  });

  it("count and subtotal are sums of quantities and price*qty", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1")); // 1 × 100
    await user.click(screen.getByTestId("add-2")); // 1 × 50
    await user.click(screen.getByTestId("add-2-again")); // 2 × 50
    const state = readState();
    expect(state.count).toBe(3);
    expect(state.subtotal).toBe(200);
  });

  it("re-hydrates from localStorage on mount", () => {
    const stored: CartItem[] = [
      { product: makeProduct({ id: 9, price: 77, stock: 10 }), quantity: 2 },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    const state = readState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe(9);
    expect(state.items[0].quantity).toBe(2);
    expect(state.subtotal).toBe(154);
  });

  it("a malformed `bazarhub-cart` value falls back to [] without throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    // Suppress the React error log from JSON.parse failure in the
    // component's try/catch — it logs to console but shouldn't throw.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    expect(readState().items).toEqual([]);
    consoleError.mockRestore();
  });

  it("persists mutations to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHost />
      </CartProvider>,
    );
    await user.click(screen.getByTestId("add-1"));
    // After the React effect runs, the storage should reflect the new cart.
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].product.id).toBe(1);
  });
});
