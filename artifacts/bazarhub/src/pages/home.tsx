import { ArrowRight, ChevronRight, CircleCheck, Clock3, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useListCategories, useListDeals, useListProducts } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { ErrorState, ProductSkeletons } from '@/components/page-states';

export default function Home() {
  const categoriesQuery = useListCategories();
  const dealsQuery = useListDeals();
  const productsQuery = useListProducts({ limit: 8, sort: 'popular' });
  const categories = categoriesQuery.data ?? [];
  const deals = dealsQuery.data ?? [];
  const products = productsQuery.data ?? [];

  return (
    <div>
      <section className="hero-burst overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 md:grid-cols-[1.08fr_.92fr] md:px-8 md:py-20 lg:py-24">
          <div className="fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent"><Sparkles size={14} /> Your corner of the internet, but warmer</div>
            <h1 className="max-w-2xl font-display text-[clamp(3.2rem,8vw,7rem)] leading-[.9] tracking-[-.055em] text-secondary">Small joys.<br /><span className="text-accent">Big bazar</span><br />energy.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">From pantry staples to self-care rituals, find good things from trusted sellers across Bangladesh.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3.5 text-sm font-bold text-secondary-foreground shadow-lg transition-transform hover:-translate-y-1" data-testid="link-hero-shop">Start browsing <ArrowRight size={17} /></Link>
              <Link href="/products?sort=popular" className="inline-flex items-center gap-2 rounded-xl border border-secondary/25 bg-card/50 px-5 py-3.5 text-sm font-bold text-secondary transition-colors hover:border-primary hover:bg-primary/15" data-testid="link-hero-popular">See what is popular</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-muted-foreground"><span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[hsl(151_35%_48%)]" /> Verified sellers</span><span className="inline-flex items-center gap-2"><MapPin size={16} className="text-accent" /> Nationwide delivery</span><span className="inline-flex items-center gap-2"><CircleCheck size={16} className="text-primary" /> Easy returns</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[540px] md:justify-self-end">
            <div className="absolute -right-4 -top-7 hidden rotate-6 rounded-xl bg-primary px-4 py-3 font-mono-brand text-xs font-bold text-primary-foreground shadow-lg sm:block">TODAY'S<br />GOOD STUFF</div>
            <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-card bg-[hsl(178_31%_24%)] p-5 shadow-2xl md:p-7">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[28px] border-primary/30" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/50 blur-2xl" />
              <div className="relative">
                <p className="font-mono-brand text-xs tracking-widest text-primary">THE BAZARHUB EDIT</p>
                <h2 className="mt-4 max-w-xs font-display text-4xl leading-[.98] text-card">Things worth<br />bringing home.</h2>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="aspect-[.82] overflow-hidden rounded-2xl bg-[hsl(35_92%_57%)] p-3"><div className="flex h-full flex-col justify-between"><span className="font-mono-brand text-4xl font-bold text-secondary/50">01</span><p className="font-bold leading-4 text-secondary">Kitchen<br />comforts</p></div></div>
                  <div className="mt-8 aspect-[.82] overflow-hidden rounded-2xl bg-[hsl(11_69%_62%)] p-3"><div className="flex h-full flex-col justify-between"><span className="font-mono-brand text-4xl font-bold text-card/60">02</span><p className="font-bold leading-4 text-card">Little<br />luxuries</p></div></div>
                </div>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-card/10 px-3 py-3 text-xs text-card"><span>Picked in Dhaka, delivered everywhere</span><ArrowRight size={15} className="text-primary" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 md:py-14">
        <div className="mb-5 flex items-end justify-between"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">Browse by mood</p><h2 className="mt-1 font-display text-3xl text-secondary md:text-4xl">What are you after?</h2></div><Link href="/products" className="hidden items-center gap-1 text-sm font-bold text-accent sm:flex" data-testid="link-all-categories">All categories <ChevronRight size={16} /></Link></div>
        {categoriesQuery.isLoading ? <div className="flex gap-3 overflow-hidden"><div className="h-24 w-40 animate-pulse rounded-2xl bg-muted" /><div className="h-24 w-40 animate-pulse rounded-2xl bg-muted" /><div className="h-24 w-40 animate-pulse rounded-2xl bg-muted" /></div> : categoriesQuery.isError ? <ErrorState onRetry={() => categoriesQuery.refetch()} title="Categories wandered off" /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => <Link href={`/products?category=${encodeURIComponent(category.name)}`} key={category.id} className={`group flex min-h-[118px] flex-col justify-between rounded-2xl border border-border p-4 transition-transform hover:-translate-y-1 ${index % 3 === 0 ? 'bg-[hsl(35_92%_57%)]' : index % 3 === 1 ? 'bg-[hsl(11_69%_62%)]' : 'bg-secondary text-secondary-foreground'}`} data-testid={`link-category-${category.id}`}><span className="font-mono-brand text-2xl font-bold opacity-55 transition-transform group-hover:scale-110">0{index + 1}</span><span><span className="block text-sm font-bold">{category.name}</span><span className="mt-0.5 block text-[11px] opacity-70">{category.nameBn} · {category.count} items</span></span></Link>)}
          </div>
        )}
      </section>

      <section className="bg-[hsl(178_31%_24%)] text-card">
        <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
          <div className="mb-7 flex items-end justify-between"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-primary">Drops & steals</p><h2 className="mt-1 font-display text-3xl md:text-4xl">Good deals, no funny business.</h2></div><Link href="/products?sort=price_asc" className="hidden items-center gap-1 text-sm font-bold text-primary sm:flex" data-testid="link-deals">See all deals <ChevronRight size={16} /></Link></div>
          {dealsQuery.isLoading ? <ProductSkeletons count={4} /> : dealsQuery.isError ? <ErrorState onRetry={() => dealsQuery.refetch()} /> : deals.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{deals.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="rounded-2xl border border-card/20 p-8 text-center text-sm text-card/70">New deals are being unpacked. Check back soon.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
        <div className="mb-7 flex items-end justify-between"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">The neighbourhood shelf</p><h2 className="mt-1 font-display text-3xl text-secondary md:text-4xl">Popular right now</h2></div><Link href="/products" className="hidden items-center gap-1 text-sm font-bold text-accent sm:flex" data-testid="link-popular">Browse everything <ChevronRight size={16} /></Link></div>
        {productsQuery.isLoading ? <ProductSkeletons count={8} /> : productsQuery.isError ? <ErrorState onRetry={() => productsQuery.refetch()} /> : products.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">The shelves are quiet for now.</p>}
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-14 md:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-primary md:grid-cols-[1fr_auto]">
          <div className="p-7 md:p-12"><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-secondary/70">Why BazarHub</p><h2 className="mt-3 max-w-xl font-display text-4xl leading-tight text-secondary md:text-5xl">Shopping that feels a little more human.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-secondary/75">We make room for the people behind the products — small sellers, big care, and a market you can trust.</p></div>
          <div className="flex min-w-[270px] flex-col justify-center gap-4 bg-secondary p-7 text-secondary-foreground md:p-10"><div className="flex items-center gap-3"><ShieldCheck className="text-primary" /><span className="text-sm font-bold">Seller checks, always</span></div><div className="flex items-center gap-3"><Clock3 className="text-primary" /><span className="text-sm font-bold">Reliable delivery updates</span></div><div className="flex items-center gap-3"><CircleCheck className="text-primary" /><span className="text-sm font-bold">No-stress returns</span></div></div>
        </div>
      </section>
    </div>
  );
}