import { useEffect, useMemo } from 'react';
import { ArrowRight, BadgeCheck, Beef, Carrot, Check, Clock3, Fish, Headset, Leaf, PhoneCall, ShieldCheck, ShoppingBasket, Sparkles, Truck, Wheat } from 'lucide-react';
import { useLocation } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { EmptyState, ErrorState, ProductSkeletons } from '@/components/page-states';

const sellerPhone = '+8801712345678';

const marketFilters = [
  { key: 'all', label: 'সব পণ্য', note: 'Full market', icon: ShoppingBasket },
  { key: 'মাছ', label: 'মাছ', note: 'Catch of the day', icon: Fish },
  { key: 'মাংস', label: 'মাংস', note: 'Cut your way', icon: Beef },
  { key: 'আলু-পেঁয়াজ', label: 'আলু-পেঁয়াজ', note: 'Kitchen staples', icon: Leaf },
  { key: 'শাকসবজি', label: 'শাকসবজি', note: 'Picked this morning', icon: Carrot },
  { key: 'ডাল ও শস্য', label: 'ডাল ও শস্য', note: 'Pantry basics', icon: Wheat },
  { key: 'মসলা ও পেস্ট', label: 'মসলা ও পেস্ট', note: 'Finish the dish', icon: Sparkles },
] as const;

function getSelectedFilter(location: string) {
  const value = new URLSearchParams(location.split('?')[1] ?? '').get('type');
  return marketFilters.some((filter) => filter.key === value) ? value ?? 'all' : 'all';
}

export default function FreshMarket() {
  const [location, setLocation] = useLocation();
  const selectedFilter = getSelectedFilter(location);
  const productsQuery = useListProducts({ category: 'fresh-market', sort: 'popular', limit: 50 });
  const products = productsQuery.data ?? [];

  useEffect(() => {
    document.title = 'কাঁচা বাজার — BOLOBAN SHOP';
  }, []);

  const visibleProducts = useMemo(
    () => selectedFilter === 'all' ? products : products.filter((product) => product.badge === selectedFilter),
    [products, selectedFilter],
  );

  const chooseFilter = (key: string) => {
    setLocation(key === 'all' ? '/fresh-market' : `/fresh-market?type=${encodeURIComponent(key)}`);
  };

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-[hsl(var(--fresh-ink)/.12)] bg-[hsl(var(--fresh-cream))]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-10 pt-7 md:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)] md:items-center md:px-8 md:pb-16 md:pt-12">
          <div className="relative z-10 fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--fresh-ink)/.14)] bg-card/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--fresh-ink))]">
              <span className="h-2 w-2 rounded-full bg-[hsl(151_42%_43%)]" /> Dhaka fresh dispatch
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(3.1rem,8vw,6.8rem)] leading-[.88] tracking-[-.055em] text-[hsl(var(--fresh-ink))]">
              বাজারের স্বাদ,<br /><span className="text-[hsl(var(--fresh-coral))]">ঘরে বসেই।</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[hsl(var(--fresh-ink)/.7)] md:text-lg md:leading-8">
              আজকের মাছ, মাংস আর টাটকা সবজি—বিশ্বস্ত বিক্রেতার কাছ থেকে। অর্ডার করুন, ২–৩ ঘণ্টার মধ্যে দরজায় পৌঁছে যাবে।
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#fresh-picks" className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--fresh-ink))] px-4 py-3 text-sm font-bold text-[hsl(var(--fresh-cream))] transition-transform hover:-translate-y-0.5" data-testid="link-browse-fresh">
                আজকের বাজার দেখুন <ArrowRight size={16} />
              </a>
              <a href={`tel:${sellerPhone}`} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--fresh-ink)/.2)] bg-card/70 px-4 py-3 text-sm font-bold text-[hsl(var(--fresh-ink))] transition-colors hover:bg-card" data-testid="link-call-seller-hero">
                <PhoneCall size={16} /> বিক্রেতাকে কল
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[hsl(var(--fresh-ink)/.12)] pt-5 text-xs font-bold text-[hsl(var(--fresh-ink)/.65)]">
              <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-[hsl(var(--fresh-coral))]" /> ২–৩ ঘণ্টায় ডেলিভারি</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck size={15} className="text-[hsl(151_42%_43%)]" /> যাচাই করা বিক্রেতা</span>
            </div>
          </div>

          <div className="relative min-h-[340px] md:min-h-[430px] fade-up delay-2" aria-label="Fresh market delivery illustration">
            <div className="absolute right-0 top-1/2 h-[78%] w-[89%] -translate-y-1/2 rounded-[44%_56%_47%_53%/45%_42%_58%_55%] bg-[hsl(154_39%_79%)]" />
            <div className="absolute bottom-2 left-2 h-32 w-32 rounded-full bg-[hsl(var(--fresh-coral)/.22)] blur-2xl" />
            <div className="absolute right-8 top-3 rounded-2xl border border-[hsl(var(--fresh-ink)/.12)] bg-card px-4 py-3 shadow-[0_18px_38px_-22px_hsl(var(--fresh-ink)/.55)]">
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--fresh-ink)/.55)]">Picked today</p>
              <p className="mt-1 font-display text-xl text-[hsl(var(--fresh-ink))]">আজ সকালেই</p>
            </div>
            <div className="absolute left-[8%] top-[25%] flex h-24 w-24 -rotate-12 items-center justify-center rounded-full border-[10px] border-[hsl(10_67%_53%/.18)] bg-[hsl(10_67%_61%)] text-[hsl(var(--fresh-cream))] shadow-lg">
              <Fish size={42} strokeWidth={1.6} />
            </div>
            <div className="absolute right-[13%] top-[33%] flex h-28 w-28 rotate-12 items-center justify-center rounded-[42%] border-[9px] border-[hsl(98_31%_40%/.18)] bg-[hsl(98_37%_58%)] text-[hsl(var(--fresh-cream))] shadow-lg">
              <Carrot size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-[16%] left-[22%] flex h-32 w-32 rotate-6 items-center justify-center rounded-full border-[10px] border-[hsl(45_80%_42%/.16)] bg-[hsl(43_81%_58%)] text-[hsl(var(--fresh-ink))] shadow-lg">
              <Wheat size={53} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-[10%] right-[8%] flex items-center gap-2 rounded-2xl bg-[hsl(var(--fresh-ink))] px-4 py-3 text-[hsl(var(--fresh-cream))] shadow-[0_18px_30px_-15px_hsl(var(--fresh-ink)/.7)]">
              <Truck size={19} />
              <span className="text-xs font-bold">Cold-chain ready</span>
            </div>
            <span className="absolute left-[36%] top-[12%] h-3 w-3 rounded-full bg-[hsl(var(--fresh-coral))]" />
            <span className="absolute bottom-[5%] left-[8%] h-4 w-4 rounded-full bg-[hsl(var(--fresh-ink))]" />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-secondary-foreground/10 px-4 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
          <div className="flex items-center gap-4 py-4 md:px-6 md:first:pl-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Clock3 size={19} /></span>
            <div><p className="text-sm font-bold">২–৩ ঘণ্টার ডেলিভারি</p><p className="mt-0.5 text-xs text-secondary-foreground/60">আপনার এলাকার সময় অনুযায়ী</p></div>
          </div>
          <div className="flex items-center gap-4 py-4 md:px-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-foreground/10 text-primary"><ShieldCheck size={19} /></span>
            <div><p className="text-sm font-bold">দাম ও মান পরিষ্কার</p><p className="mt-0.5 text-xs text-secondary-foreground/60">কোনও লুকানো চার্জ নেই</p></div>
          </div>
          <div className="flex items-center gap-4 py-4 md:px-6 md:pr-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-foreground/10 text-primary"><Headset size={19} /></span>
            <div><p className="text-sm font-bold">সরাসরি বিক্রেতার সাথে কথা</p><p className="mt-0.5 text-xs text-secondary-foreground/60">প্রয়োজনে কল করে নিন</p></div>
          </div>
        </div>
      </section>

      <main id="fresh-picks" className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 md:py-16">
        <div className="mb-7 flex flex-col gap-3 md:mb-9 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[.22em] text-accent">Fresh, not forgotten</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-secondary md:text-5xl">আজকের বাছাই</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground md:text-right">আপনার রান্নাঘরের জন্য দরকারি জিনিস, এক স্ক্রিনে।</p>
        </div>

        <div className="mb-8 -mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2" role="tablist" aria-label="Fresh market categories">
            {marketFilters.map((filter) => {
              const Icon = filter.icon;
              const active = selectedFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => chooseFilter(filter.key)}
                  role="tab"
                  aria-selected={active}
                  className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-left transition-all ${active ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm' : 'border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-secondary/40'}`}
                  data-testid={`button-fresh-filter-${filter.key}`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-secondary'}`}><Icon size={15} /></span>
                  <span><span className="block text-xs font-bold">{filter.label}</span><span className={`hidden text-[10px] sm:block ${active ? 'text-secondary-foreground/60' : 'text-muted-foreground'}`}>{filter.note}</span></span>
                </button>
              );
            })}
          </div>
        </div>

        {productsQuery.isLoading ? (
          <ProductSkeletons count={8} />
        ) : productsQuery.isError ? (
          <ErrorState onRetry={() => productsQuery.refetch()} title="আজকের বাজার লোড হচ্ছে না" />
        ) : visibleProducts.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <div key={product.id} className={`fade-up ${index > 3 ? 'delay-2' : ''}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="এই বিভাগে আজ কিছু নেই"
            detail="অন্য একটি বাজার বিভাগ দেখুন, অথবা একটু পরে আবার আসুন।"
            action={<button type="button" onClick={() => chooseFilter('all')} className="mt-6 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground" data-testid="button-fresh-reset">সব পণ্য দেখুন</button>}
          />
        )}
      </main>

      <section className="mx-auto max-w-[1440px] px-4 pb-14 md:px-8 md:pb-20">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[hsl(var(--fresh-ink))] px-5 py-8 text-[hsl(var(--fresh-cream))] md:px-10 md:py-10">
          <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[32px] border-[hsl(var(--fresh-coral)/.28)]" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 inline-flex items-center gap-2 font-mono-brand text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--fresh-coral))]"><PhoneCall size={13} /> Real seller, real answer</p>
              <h2 className="font-display text-3xl leading-tight md:text-4xl">কোনটা ভালো বুঝতে পারছেন না?</h2>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--fresh-cream)/.65)]">অর্ডারের আগে আজকের স্টক, কাটিং বা ডেলিভারি নিয়ে সরাসরি কথা বলুন।</p>
            </div>
            <a href={`tel:${sellerPhone}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--fresh-coral))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--fresh-cream))] transition-transform hover:-translate-y-0.5" data-testid="link-call-seller">
              <PhoneCall size={17} /> কল করুন · 01712 345 678
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[hsl(var(--fresh-mint)/.35)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-secondary"><Check size={17} /></span>
            <p className="text-sm font-bold text-secondary">আপনার বাজারের ব্যাগ এখন আরও সহজ।</p>
          </div>
          <a href="#fresh-picks" className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-secondary">উপরে ফিরে যান <ArrowRight size={14} className="-rotate-90" /></a>
        </div>
      </section>
    </div>
  );
}