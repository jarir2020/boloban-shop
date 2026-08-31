import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Grid2X2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
} from 'lucide-react';
import { Link } from 'wouter';
import {
  useListCategories,
  useListDeals,
  useListProducts,
} from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { ErrorState, ProductSkeletons } from '@/components/page-states';

function categoryHref(category: { id: string; name: string }) {
  return `/products?category=${encodeURIComponent(category.id)}`;
}

export default function Home() {
  const categoriesQuery = useListCategories();
  const dealsQuery = useListDeals();
  const productsQuery = useListProducts({ limit: 8, sort: 'popular' });
  const categories = categoriesQuery.data ?? [];
  const deals = dealsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const heroProduct = deals[0];
  const secondaryHeroProduct = deals[1];

  return (
    <div className="bg-[#f6f6f6]">
      <section className="border-b border-[#e7e7e7] bg-[#fff3e8]" style={{ backgroundColor: '#fff3e8' }}>
        <div className="mx-auto max-w-[1440px] px-4 py-3 md:px-8">
          <div className="flex items-center justify-between text-xs text-[#555]">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <MapPin size={14} className="text-[#f57224]" /> Deliver to Bangladesh
            </span>
            <span className="mx-auto font-bold text-[#f57224] sm:mx-0">
              Big savings, everyday prices
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <ShieldCheck size={14} className="text-[#f57224]" /> Buyer protection
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-4 md:px-8 md:py-6">
        <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)_250px]">
          <aside className="hidden rounded-sm bg-white p-4 shadow-sm lg:block">
            <div className="mb-3 flex items-center gap-2 border-b border-[#eeeeee] pb-3 text-sm font-bold text-[#333]">
              <Grid2X2 size={17} className="text-[#f57224]" /> Categories
            </div>
            {categoriesQuery.isLoading ? (
              <div className="space-y-4">
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
              </div>
            ) : categoriesQuery.isError ? (
              <ErrorState onRetry={() => categoriesQuery.refetch()} title="Categories unavailable" />
            ) : (
              <div className="space-y-1">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    href={categoryHref(category)}
                    className="group flex items-center justify-between rounded px-2 py-2.5 text-sm text-[#555] transition-colors hover:bg-[#fff3e8] hover:text-[#f57224]"
                    data-testid={`link-home-category-${category.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3e8] text-[#f57224] transition-transform group-hover:scale-110">
                        {category.icon}
                      </span>
                      {category.name}
                    </span>
                    <ChevronRight size={14} className="text-[#aaa]" />
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/products"
              className="mt-3 flex items-center justify-between border-t border-[#eeeeee] pt-3 text-sm font-bold text-[#f57224]"
              data-testid="link-home-all-categories"
            >
              View all categories <ArrowRight size={15} />
            </Link>
          </aside>

          <div className="relative min-h-[300px] overflow-hidden rounded-sm bg-[#f57224] px-6 py-8 text-white shadow-sm md:px-10 md:py-10" style={{ backgroundColor: '#f57224' }}>
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-white/15" />
            <div className="absolute -bottom-36 right-24 h-80 w-80 rounded-full bg-[#ff9a42]/60 blur-3xl" />
            <div className="relative z-10 max-w-[470px]">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-white/80">
                <Sparkles size={14} /> BOLOBAN SHOP
              </p>
              <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
                Shop more.
                <br />
                Pay less.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/85 md:text-base">
                Deals from trusted sellers, delivered anywhere in Bangladesh.
                Find your next favorite thing today.
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-sm font-bold text-[#f57224] shadow-md transition-transform hover:-translate-y-0.5"
                data-testid="link-home-shop-now"
              >
                Shop now <ArrowRight size={17} />
              </Link>
            </div>
            <div className="absolute bottom-4 right-5 hidden items-end gap-3 sm:flex">
              {[heroProduct, secondaryHeroProduct].filter(Boolean).map((product, index) => (
                <Link
                  key={product!.id}
                  href={`/products/${product!.id}`}
                  className={`relative h-36 w-28 overflow-hidden rounded bg-white/95 p-2 shadow-xl transition-transform hover:-translate-y-2 ${index === 1 ? 'mb-8' : ''}`}
                  data-testid={`link-home-hero-product-${product!.id}`}
                >
                  <img src={product!.image} alt={product!.name} className="h-24 w-full object-cover" />
                  <p className="truncate text-[10px] font-bold text-[#333]">{product!.name}</p>
                  <p className="text-xs font-black text-[#f57224]">৳{product!.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-sm bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-[#333]">
                <UserRound size={18} className="text-[#f57224]" /> Welcome to SHOP
              </div>
              <p className="mt-2 text-xs leading-5 text-[#777]">
                Sign in for a faster checkout and order tracking.
              </p>
              <button
                onClick={() => window.alert('Account sign-in is coming soon. You can shop without an account.')}
                className="mt-3 w-full rounded-sm bg-[#f57224] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d95f16]"
                style={{ backgroundColor: '#f57224' }}
                data-testid="button-home-sign-in"
              >
                Sign in / Register
              </button>
            </div>
            <div className="rounded-sm bg-[#fff3e8] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-[#333]">
                <Truck size={18} className="text-[#f57224]" /> Free delivery
              </div>
              <p className="mt-2 text-xs leading-5 text-[#777]">
                Enjoy delivery savings on selected orders across Bangladesh.
              </p>
              <Link href="/products" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f57224]">
                Explore offers <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-6 md:px-8">
        <div className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3e8] text-[#f57224]">
              <Clock3 size={18} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#333]">Flash Sale</h2>
              <p className="text-xs text-[#888]">Limited time deals</p>
            </div>
            <div className="ml-2 hidden items-center gap-1 text-sm font-black text-white sm:flex">
              <span className="rounded bg-[#333] px-2 py-1">10</span>
              <span className="text-[#333]">:</span>
              <span className="rounded bg-[#333] px-2 py-1">24</span>
              <span className="text-[#333]">:</span>
              <span className="rounded bg-[#333] px-2 py-1">18</span>
            </div>
          </div>
          <Link href="/products?sort=price_asc" className="flex items-center gap-1 text-sm font-bold text-[#f57224]" data-testid="link-home-flash-sale">
            See more <ChevronRight size={16} />
          </Link>
        </div>
        {dealsQuery.isLoading ? (
          <div className="bg-white p-4">
            <ProductSkeletons count={4} />
          </div>
        ) : dealsQuery.isError ? (
          <div className="bg-white p-4"><ErrorState onRetry={() => dealsQuery.refetch()} /></div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-[#eeeeee] md:grid-cols-4">
            {deals.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white p-3 md:p-4">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-6 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#333]">Categories</h2>
          <Link href="/products" className="flex items-center gap-1 text-sm font-bold text-[#f57224]" data-testid="link-home-categories-see-more">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        {categoriesQuery.isLoading ? (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse bg-white" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={categoryHref(category)}
                className="group flex min-h-28 flex-col items-center justify-center gap-2 bg-white p-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                data-testid={`link-home-category-card-${category.id}`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${index % 3 === 0 ? 'bg-[#fff3e8] text-[#f57224]' : index % 3 === 1 ? 'bg-[#fff0f0] text-[#e94b4b]' : 'bg-[#eaf8f5] text-[#238b77]'}`}>
                  {category.icon}
                </span>
                <span className="text-xs font-bold text-[#444] group-hover:text-[#f57224]">{category.name}</span>
                <span className="text-[10px] text-[#999]">{category.count} items</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-16 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#f57224]">For you</p>
            <h2 className="text-xl font-black text-[#333]">Recommended for you</h2>
          </div>
          <Link href="/products" className="flex items-center gap-1 text-sm font-bold text-[#f57224]" data-testid="link-home-recommended-see-more">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        {productsQuery.isLoading ? (
          <ProductSkeletons count={8} />
        ) : productsQuery.isError ? (
          <ErrorState onRetry={() => productsQuery.refetch()} />
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="bg-white p-10 text-center text-sm text-[#777]">Products are being unpacked. Check back soon.</p>
        )}
      </section>

      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-4 pb-10 text-xs text-[#777] md:px-8">
        <ShoppingBag size={15} className="text-[#f57224]" /> Shop confidently with BOLOBAN SHOP
      </div>
    </div>
  );
}