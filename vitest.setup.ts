import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia / IntersectionObserver / scrollTo.
// Cart lib uses neither, but a few page components do — keep these stubs so
// component-level smoke tests don't crash.
if (!("matchMedia" in window)) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!("scrollTo" in window)) {
  (window as unknown as { scrollTo: () => void }).scrollTo = () => {};
}
