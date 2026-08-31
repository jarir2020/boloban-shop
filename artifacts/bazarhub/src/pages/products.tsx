import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useListCategories, useListProducts, type ListProductsParams } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { EmptyState, ErrorState, ProductSkeletons } from '@/components/page-states';

export default function Products() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] ?? '');
  const initialQuery = params.get('q') ?? '';
  const initialCategory = params.get('category') ?? '';
  const initialSort = params.get('sort') as ListProductsParams['sort'] ?? 'popular';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<ListProductsParams['sort']>(initialSort);
  const [filterOpen, setFilterOpen] = useState(false);
  const categoriesQuery = useListCategories();
  const productParams: ListProductsParams = { q: query || undefined, category: category || undefined, sort, limit: 50 };
  const productsQuery = useListProducts(productParams);
  const products = productsQuery.data ?? [];

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  const apply = (nextCategory = category, nextSort = sort) => {
    const search = new URLSearchParams();
    if (query.trim()) search.set('q', query.trim());
    if (nextCategory) search.set('category', nextCategory);
    if (nextSort && nextSort !== 'popular') search.set('sort', nextSort);
    setLocation(`/products${search.toString() ? `?${search.toString()}` : ''}`);
    setFilterOpen(false);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end">
        <div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">The full market</p><h1 className="mt-2 font-display text-5xl leading-none text-secondary md:text-6xl" data-testid="text-catalog-title">{query ? <>Results for <span className="text-accent">“{query}”</span></> : 'Shop the good stuff'}</h1><p className="mt-3 text-sm text-muted-foreground" data-testid="text-product-count">{products.length} things waiting to be discovered</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setFilterOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold md:hidden" data-testid="button-toggle-filters"><SlidersHorizontal size={16} /> Filters</button><label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"><span className="hidden text-muted-foreground sm:inline">Sort by</span><select value={sort} onChange={(event) => { const value = event.target.value as ListProductsParams['sort']; setSort(value); apply(category, value); }} className="bg-transparent font-bold outline-none" aria-label="Sort products" data-testid="select-sort"><option value="popular">Popular</option><option value="rating">Top rated</option><option value="price_asc">Price: low first</option><option value="price_desc">Price: high first</option></select></label></div>
      </div>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className={`${filterOpen ? 'block' : 'hidden'} md:block`}><div className="sticky top-28 rounded-2xl border border-border bg-card p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-secondary">Filter market</h2><button onClick={() => setFilterOpen(false)} className="md:hidden" aria-label="Close filters" data-testid="button-close-filters"><X size={17} /></button></div><div className="mb-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</p><button onClick={() => { setCategory(''); apply('', sort); }} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold ${!category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} data-testid="button-category-all">All products <span className="text-xs opacity-60">•</span></button>{categoriesQuery.data?.map((item) => <button key={item.id} onClick={() => { setCategory(item.name); apply(item.name, sort); }} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${category === item.name ? 'bg-primary font-bold text-primary-foreground' : 'hover:bg-muted'}`} data-testid={`button-category-${item.id}`}><span className="truncate">{item.name}</span><span className="text-xs opacity-60">{item.count}</span></button>)}</div><div className="border-t border-border pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Good to know</p><p className="text-xs leading-5 text-muted-foreground">Every product has a real seller and a clear price. No surprises at checkout.</p></div></div></aside>
        <section>
          <div className="mb-5 flex items-center justify-between"><div className="flex flex-wrap gap-2">{category && <button onClick={() => { setCategory(''); apply('', sort); }} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground" data-testid="button-clear-category">{category} <X size={13} /></button>}{query && <button onClick={() => { setQuery(''); setLocation('/products'); }} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold" data-testid="button-clear-search">{query} <X size={13} /></button>}</div><div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Filter size={14} /> Updated today</div></div>
          {productsQuery.isLoading ? <ProductSkeletons count={8} /> : productsQuery.isError ? <ErrorState onRetry={() => productsQuery.refetch()} title="The shelves are shy today" /> : products.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No match, yet." detail="Try a broader search or wander through another category." action={<button onClick={() => { setQuery(''); setCategory(''); setLocation('/products'); }} className="mt-6 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground" data-testid="button-reset-filters">Reset filters</button>} />}
        </section>
      </div>
    </div>
  );
}