import {
  ArrowRight,
  BadgePercent,
  Box,
  ChevronRight,
  Clock3,
  Heart,
  LogOut,
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
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { useListProducts } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { ErrorState, ProductSkeletons } from '@/components/page-states';

const orderActions = [
  { label: 'To Pay', icon: WalletCards, status: 'pending' },
  { label: 'To Ship', icon: Box, status: 'processing' },
  { label: 'To Receive', icon: Truck, status: 'shipped' },
  { label: 'To Review', icon: MessageCircle, status: 'delivered' },
  { label: 'Returns & Cancellations', icon: RotateCcw, status: 'returns' },
];

export default function Account() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const productsQuery = useListProducts({ limit: 50, sort: 'popular' });
  const [recentIds, setRecentIds] = useState<number[]>([]);

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

  if (!isLoaded) {
    return <div className="mx-auto max-w-[920px] px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-muted" /></div>;
  }

  if (!isSignedIn || !user) {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-20 text-center md:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary"><ShoppingBag size={30} /></div>
          <h1 className="mt-5 font-display text-4xl text-secondary">Your account</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Login to view your profile, orders, vouchers and recently viewed products.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/sign-in" className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground" data-testid="link-account-login">Login</Link>
            <Link href="/sign-up" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="link-account-register">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  const name = user.fullName || user.username || 'BOLOBAN SHOP member';
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || 'Email not available';
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' }) : 'New member';

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
            <button onClick={() => signOut({ redirectUrl: basePathForAccount() })} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white/80 px-3 py-2 text-xs font-bold text-secondary transition-colors hover:border-primary hover:text-primary" data-testid="button-account-logout">
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
          {productsQuery.isLoading ? <ProductSkeletons count={4} /> : productsQuery.isError ? <ErrorState onRetry={() => productsQuery.refetch()} title="Recently viewed products are unavailable" /> : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{recentProducts.map((product) => <ProductCard key={product!.id} product={product!} />)}</div>}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/products" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-pickup-points"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf8f5] text-[#238b77]"><ShieldCheck size={21} /></span><span><strong className="block text-sm text-secondary">Pickup Points</strong><span className="text-xs text-muted-foreground">Find easy delivery options</span></span></Link>
          <Link href="/seller" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-affiliates"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3e8] text-primary"><BadgePercent size={21} /></span><span><strong className="block text-sm text-secondary">My Affiliates</strong><span className="text-xs text-muted-foreground">Share and earn with us</span></span></Link>
          <Link href="/orders" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-account-help"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1eaff] text-[#7e62c0]"><Settings size={21} /></span><span><strong className="block text-sm text-secondary">Account settings</strong><span className="text-xs text-muted-foreground">Orders and support</span></span></Link>
        </section>
      </div>
    </div>
  );
}

function basePathForAccount() {
  return `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}`;
}