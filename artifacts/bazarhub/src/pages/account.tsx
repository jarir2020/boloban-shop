import {
  ArrowRight,
  BadgePercent,
  BadgeCheck,
  Box,
  ChevronRight,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TicketPercent,
  Truck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { ProductCard } from '@/components/product-card';
import { ErrorState, ProductSkeletons } from '@/components/page-states';

const orderActions = [
  { label: 'To Pay', icon: WalletCards, status: 'pending' },
  { label: 'To Ship', icon: Box, status: 'processing' },
  { label: 'To Receive', icon: Truck, status: 'shipped' },
  { label: 'To Review', icon: MessageCircle, status: 'delivered' },
  { label: 'Returns & Cancellations', icon: RotateCcw, status: 'returns' },
];

const accountTools = [
  { label: 'BOLOBAN Candy', detail: 'Collect rewards', icon: Gift, href: '/products', tone: 'bg-[#e5f3ff] text-[#3286c7]' },
  { label: 'Buy Any 3', detail: 'Special offers', icon: BadgePercent, href: '/products?sort=price_asc', tone: 'bg-[#fff3c8] text-[#d49a00]' },
  { label: 'Pickup Points', detail: 'Easy delivery options', icon: MapPin, href: '/products', tone: 'bg-[#e3f7ed] text-[#39a879]' },
  { label: 'My Affiliates', detail: 'Share and earn', icon: UsersRound, href: '/seller', tone: 'bg-[#ffe8f1] text-[#d85c93]' },
  { label: 'Help Center', detail: 'Get support', icon: HelpCircle, href: '/orders', tone: 'bg-[#e5f3ff] text-[#3185ce]' },
  { label: 'Customer Care', detail: 'We are here to help', icon: Headphones, href: '/orders', tone: 'bg-[#f3e8ff] text-[#9b65ce]' },
  { label: 'Ratings & Reviews', detail: 'Review your orders', icon: Star, href: '/orders', tone: 'bg-[#e3f7ed] text-[#39a879]' },
  { label: 'Secure Payments', detail: 'Payment & privacy', icon: CreditCard, href: '/cart', tone: 'bg-[#e5f3ff] text-[#3185ce]' },
];

export default function Account() {
  const { user, status, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const productsQuery = useListProducts({ limit: 50, sort: 'popular' });
  const [recentIds, setRecentIds] = useState<number[]>([]);

  // While the auth state is still loading, show a skeleton.
  if (status === 'loading') {
    return <div className="mx-auto max-w-[920px] px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-muted" /></div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-20 text-center md:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
          <h1 className="mt-5 font-display text-4xl text-secondary">Your account</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Sign in to view your profile, orders, vouchers and recently viewed products.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/sign-in" className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground">Sign in</Link>
            <Link href="/sign-up" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    try {
      setRecentIds(JSON.parse(localStorage.getItem('boloban-recent-products') ?? '[]') as number[]);
    } catch {
      setRecentIds([]);
    }
  }, []);

  const recentProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    const byId = new Map(products.map((product) => [product.id, product]));
    const viewed = recentIds.map((id) => byId.get(id)).filter(Boolean);
    return (viewed.length ? viewed : products.slice(0, 4)).slice(0, 4);
  }, [productsQuery.data, recentIds]);

  const name = user.name || user.email.split("@")[0] || 'BOLOBAN SHOP member';
  const email = user.email || 'Email not available';
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' })
    : 'New member';

  return (
    <div className="bg-[#f7f7f7] pb-10">
      <section className="bg-gradient-to-br from-[#fff3ee] via-[#fff8f1] to-[#eaf8f5]">
        <div className="mx-auto max-w-[980px] px-4 py-7 md:px-8 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <img src={user.imageUrl} alt={name} className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-md md:h-24 md:w-24" data-testid="img-account-avatar" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-secondary md:text-3xl" data-testid="text-account-name">{name}</h1>
                <p className="mt-1 truncate text-sm text-muted-foreground" data-testid="text-account-email">{email}</p>
                <p className="mt-2 text-xs text-muted-foreground">Member since {joinedDate}</p>
              </div>
            </div>
            <button onClick={async () => { await signOut(); setLocation('/'); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white/80 px-3 py-2 text-xs font-bold text-secondary transition-colors hover:border-primary hover:text-primary" data-testid="button-account-logout">
              <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 text-center sm:max-w-md sm:gap-6">
            <Link href="/products" className="rounded-xl bg-white/70 px-2 py-3 shadow-sm transition-colors hover:bg-white" data-testid="link-account-wishlist">
              <Heart size={18} className="mx-auto text-primary" /><strong className="mt-1 block text-sm text-secondary">0</strong><span className="text-[11px] text-muted-foreground">Wishlist</span>
            </Link>
            <Link href="/seller" className="rounded-xl bg-white/70 px-2 py-3 shadow-sm transition-colors hover:bg-white" data-testid="link-account-stores">
              <Store size={18} className="mx-auto text-primary" /><strong className="mt-1 block text-sm text-secondary">0</strong><span className="text-[11px] text-muted-foreground">Followed Stores</span>
            </Link>
            <Link href="/products?sort=price_asc" className="rounded-xl bg-white/70 px-2 py-3 shadow-sm transition-colors hover:bg-white" data-testid="link-account-vouchers">
              <TicketPercent size={18} className="mx-auto text-primary" /><strong className="mt-1 block text-sm text-secondary">3</strong><span className="text-[11px] text-muted-foreground">Vouchers</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[980px] space-y-4 px-4 py-5 md:px-8 md:py-7">
        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Rewards & offers</p><h2 className="mt-1 text-xl font-black text-secondary">Plant. Grow. Win!</h2></div>
            <Link href="/products" className="flex items-center gap-1 text-sm font-bold text-primary" data-testid="link-account-grow">Grow here <ChevronRight size={16} /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/products?sort=price_asc" className="flex items-center gap-3 rounded-xl bg-[#fff5d9] p-4 transition-transform hover:-translate-y-0.5" data-testid="link-account-coins">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd34e] text-xl">🪙</span>
              <span><strong className="block text-sm text-secondary">BOLOBAN Coins</strong><span className="mt-1 block text-xs text-muted-foreground">Enjoy extra savings on selected finds.</span><b className="mt-2 block text-xs text-primary">Use now <ArrowRight className="ml-1 inline" size={13} /></b></span>
            </Link>
            <Link href="/products" className="flex items-center gap-3 rounded-xl bg-[#f1eaff] p-4 transition-transform hover:-translate-y-0.5" data-testid="link-account-freebie">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a98cff] text-xl">🎁</span>
              <span><strong className="block text-sm text-secondary">BOLOBAN Freebie</strong><span className="mt-1 block text-xs text-muted-foreground">Discover deals and special gifts.</span><b className="mt-2 block text-xs text-primary">Explore now <ArrowRight className="ml-1 inline" size={13} /></b></span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-secondary">My Orders</h2><Link href="/orders" className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-account-all-orders">View all orders <ChevronRight size={16} /></Link></div>
          <div className="grid grid-cols-5 gap-1 sm:gap-3">
            {orderActions.map((action) => {
              const Icon = action.icon;
              return <Link key={action.label} href="/orders" className="group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-center transition-colors hover:bg-[#fff3e8]" data-testid={`link-account-order-${action.status}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3e8] text-primary group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={20} /></span>
                <span className="text-[10px] font-bold leading-4 text-muted-foreground group-hover:text-primary sm:text-xs">{action.label}</span>
              </Link>;
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Your history</p><h2 className="mt-1 text-xl font-black text-secondary">Recently Viewed</h2></div><Link href="/products" className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-account-view-more">View more <ChevronRight size={16} /></Link></div>
          {productsQuery.isLoading ? <ProductSkeletons count={4} /> : productsQuery.isError ? <ErrorState onRetry={() => productsQuery.refetch()} title="Recently viewed products are unavailable" /> : recentIds.length === 0 ? (
            <div className="flex min-h-[150px] items-center justify-between gap-5 rounded-xl bg-[#fffdfb] px-4 py-3 md:px-8">
              <div><p className="max-w-[250px] text-base font-medium leading-5 text-secondary">Rediscover the delightful items you&apos;ve viewed recently!</p><Link href="/products" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="link-account-continue-shopping">Continue Shopping</Link></div>
              <div className="relative hidden h-28 w-32 shrink-0 sm:block"><span className="absolute bottom-1 left-5 h-16 w-20 rotate-[-7deg] rounded-b-lg border-4 border-[#e7b789] bg-[#f7d1a5]" /><span className="absolute bottom-14 left-4 h-5 w-24 rotate-[-7deg] rounded-t-lg border-4 border-b-0 border-[#e7b789] bg-[#fff0d3]" /><span className="absolute right-1 top-2 text-3xl">✦</span><span className="absolute right-8 top-0 text-xl text-primary">✦</span></div>
            </div>
          ) : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{recentProducts.map((product) => <ProductCard key={product!.id} product={product!} />)}</div>}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-4 gap-y-5">
            {accountTools.map((tool) => {
              const Icon = tool.icon;
              return <Link key={tool.label} href={tool.href} className="group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-[#fff8ef]" data-testid={`link-account-tool-${tool.label.toLowerCase().replaceAll(' ', '-')}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.tone} transition-transform group-hover:-translate-y-0.5`}><Icon size={23} /></span>
                <span className="text-[10px] font-bold leading-4 text-secondary sm:text-xs">{tool.label}</span>
                <span className="hidden text-[10px] text-muted-foreground sm:block">{tool.detail}</span>
              </Link>;
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/products" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-discover"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf8f5] text-[#238b77]"><ShieldCheck size={21} /></span><span><strong className="block text-sm text-secondary">Safe shopping</strong><span className="text-xs text-muted-foreground">Trusted sellers and delivery</span></span></Link>
          <Link href="/seller" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-sell"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3e8] text-primary"><Store size={21} /></span><span><strong className="block text-sm text-secondary">Sell on BOLOBAN</strong><span className="text-xs text-muted-foreground">Start your shop today</span></span></Link>
          <Link href="/orders" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-settings"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1eaff] text-[#7e62c0]"><Settings size={21} /></span><span><strong className="block text-sm text-secondary">Account settings</strong><span className="text-xs text-muted-foreground">Orders and support</span></span></Link>
        </section>
      </div>
    </div>
  );
}