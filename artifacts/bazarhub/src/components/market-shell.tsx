import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Bell, Heart, Home, LogOut, Menu, MessageCircle, Search, ShoppingBag, ShoppingBasket, Store, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

const logoImage = '/boloban-shop-logo.jpg';

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Categories' },
  { href: '/fresh-market', label: 'Fresh market' },
  { href: '/orders', label: 'My orders' },
];

export function MarketShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { data: health } = useHealthCheck();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [selectedMobileNav, setSelectedMobileNav] = useState<string | null>(null);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setLocation(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };
  const accountHref = user ? '/account' : '/sign-in';

  useEffect(() => {
    if (location === '/') setSelectedMobileNav('home');
    else if (location.startsWith('/cart')) setSelectedMobileNav('cart');
    else if (location.startsWith('/account')) setSelectedMobileNav('account');
    else if (location.startsWith('/fresh-market')) setSelectedMobileNav('market');
    else if (selectedMobileNav !== 'messages') setSelectedMobileNav(null);
  }, [location]);

  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      <div className="bg-secondary px-4 py-2 text-center text-[11px] font-bold tracking-wide text-secondary-foreground">
        Sell on BOLOBAN SHOP <span className="mx-2 text-primary">•</span> Help & Support <span className="mx-2 text-primary">•</span> Download the app
      </div>
      <header className="sticky top-0 z-40 border-b border-primary/40 bg-primary shadow-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2" data-testid="link-logo">
            <img src={logoImage} alt="BOLOBAN SHOP" className="h-11 w-11 rounded-xl object-cover shadow-sm transition-transform group-hover:scale-105" />
            <span className="hidden font-display text-2xl tracking-tight text-primary-foreground sm:block">BOLOBAN<span className="text-secondary"> SHOP</span></span>
          </Link>
          <form onSubmit={search} className="relative min-w-0 flex-1 md:max-w-xl" data-testid="form-search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search in BOLOBAN SHOP..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-12 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-secondary focus:ring-4 focus:ring-secondary/15" aria-label="Search products" data-testid="input-search" />
            <button type="submit" className="absolute right-1.5 top-1.5 rounded-lg bg-secondary p-2 text-secondary-foreground transition-transform hover:scale-105" aria-label="Submit search" data-testid="button-submit-search"><Search size={16} /></button>
          </form>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-secondary/15 ${location === link.href ? 'bg-secondary/15' : ''}`} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</Link>)}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
            <button onClick={() => toast({ title: 'Your favorites', description: 'Favorite products will appear here as you save them.' })} className="hidden rounded-xl p-2.5 text-primary-foreground transition-colors hover:bg-secondary/15 sm:block" aria-label="Favorites" data-testid="button-favorites"><Heart size={19} /></button>
            <button onClick={() => toast({ title: 'You are all caught up', description: 'No new market updates right now.' })} className="hidden rounded-xl p-2.5 text-primary-foreground transition-colors hover:bg-secondary/15 sm:block" aria-label="Notifications" data-testid="button-notifications"><Bell size={19} /></button>
            <Link href="/cart" className="relative hidden rounded-xl p-2.5 text-primary-foreground transition-colors hover:bg-secondary/15 sm:block" aria-label={`Cart with ${count} items`} data-testid="link-cart">
              <ShoppingBag size={20} />
              {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground" data-testid="text-cart-count">{count}</span>}
            </Link>
            {user ? (
              <button onClick={() => void signOut()} className="inline-flex items-center justify-center rounded-lg bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/85" aria-label="Log out" title="Log out" data-testid="button-account"><LogOut size={18} /></button>
            ) : (
              <>
                <Link href="/sign-in" className="inline-flex rounded-lg px-1.5 py-2 text-[10px] font-bold text-primary-foreground transition-colors hover:bg-secondary/15 sm:px-2 sm:text-sm" data-testid="button-login">Login</Link>
                <Link href="/sign-up" className="inline-flex rounded-lg bg-secondary px-2 py-2 text-[10px] font-bold text-secondary-foreground transition-colors hover:bg-secondary/85 sm:px-3 sm:text-sm" data-testid="button-register">Register</Link>
              </>
            )}
          </div>
        </div>
        <div className="hidden border-t border-primary-foreground/20 bg-secondary/95 md:block">
          <div className="mx-auto flex max-w-[1440px] items-center gap-6 overflow-x-auto px-4 py-2 text-xs font-bold text-secondary-foreground md:px-8">
            <Link href="/products" className="inline-flex shrink-0 items-center gap-2 hover:text-primary"><Menu size={14} /> All Categories</Link>
            <Link href="/products?sort=price_asc" className="shrink-0 hover:text-primary">Flash Sale</Link>
            <Link href="/products?category=electronics" className="shrink-0 hover:text-primary">Electronics</Link>
            <Link href="/products?category=fashion" className="shrink-0 hover:text-primary">Fashion</Link>
            <Link href="/products?category=home" className="shrink-0 hover:text-primary">Home & Living</Link>
            <Link href="/seller" className="ml-auto inline-flex shrink-0 items-center gap-2 hover:text-primary"><Store size={14} /> Sell on BOLOBAN SHOP</Link>
          </div>
        </div>
      </header>
      {health?.status && <div className="mx-auto hidden max-w-[1440px] items-center justify-end gap-1.5 px-8 pt-3 text-[10px] font-mono-brand uppercase tracking-wider text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(151_35%_48%)]" /> Market live</div>}
      <main className="pb-20 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 px-2 shadow-[0_-8px_24px_-18px_hsl(var(--foreground)/.45)] backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Mobile navigation">
        <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-end">
          <Link href="/" className={`flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${selectedMobileNav === 'home' ? 'text-[#f2b705]' : 'text-muted-foreground'}`} data-testid="mobile-nav-for-you">
            <Home size={20} />
            <span>For You</span>
          </Link>
          <button onClick={() => { setSelectedMobileNav('messages'); toast({ title: 'Messages', description: 'Your seller messages will appear here.' }); }} className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${selectedMobileNav === 'messages' ? 'text-[#f2b705]' : 'text-muted-foreground'}`} data-testid="mobile-nav-messages">
            <MessageCircle size={21} />
            <span className="absolute left-1/2 top-2 -translate-y-1/2 translate-x-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] leading-none text-accent-foreground">14</span>
            <span>Messages</span>
          </button>
          <Link href="/fresh-market" className={`group flex flex-col items-center justify-end gap-1 rounded-xl text-[10px] font-bold transition-colors ${selectedMobileNav === 'market' ? 'text-[#f2b705]' : 'text-muted-foreground'}`} data-testid="mobile-nav-fresh-market">
            <span className={`-mt-7 flex h-16 w-16 items-center justify-center rounded-full border-4 border-card shadow-lg transition-transform group-hover:-translate-y-1 ${selectedMobileNav === 'market' ? 'bg-[#f2b705]' : 'bg-primary'}`}>
              <ShoppingBasket size={28} className="text-white" />
            </span>
            <span className="pb-2 text-xs font-black">কাঁচা বাজার</span>
          </Link>
          <Link href="/cart" className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${selectedMobileNav === 'cart' ? 'text-[#f2b705]' : 'text-muted-foreground'}`} data-testid="mobile-nav-cart">
            <ShoppingBag size={21} />
            {count > 0 && <span className="absolute left-1/2 top-2 -translate-y-1/2 translate-x-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] leading-none text-accent-foreground">{count > 99 ? '99+' : count}</span>}
            <span>Cart</span>
          </Link>
          <Link href={accountHref} className={`flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${selectedMobileNav === 'account' ? 'text-[#f2b705]' : 'text-muted-foreground'}`} data-testid="mobile-nav-account">
            <UserRound size={21} />
            <span>Account</span>
          </Link>
        </div>
      </nav>
      <footer className="mt-20 bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:px-8">
          <div><div className="flex items-center gap-2"><img src={logoImage} alt="BOLOBAN SHOP" className="h-9 w-9 rounded-lg object-cover" /><span className="font-display text-xl">BOLOBAN SHOP</span></div><p className="mt-4 max-w-xs text-sm leading-6 text-secondary-foreground/70">The everyday marketplace for great finds, trusted sellers, and easy delivery.</p></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Explore</p><div className="grid gap-2 text-sm text-secondary-foreground/75"><Link href="/products" className="hover:text-primary" data-testid="link-footer-shop">Shop all</Link><Link href="/orders" className="hover:text-primary" data-testid="link-footer-orders">Track an order</Link><Link href="/seller" className="hover:text-primary" data-testid="link-footer-sell">Sell with us</Link></div></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">We care</p><div className="grid gap-2 text-sm text-secondary-foreground/75"><button onClick={() => toast({ title: 'Help is on the way', description: 'Our care team is available every day, 9am–9pm.' })} className="text-left hover:text-primary" data-testid="button-footer-help">Help center</button><button onClick={() => toast({ title: 'Easy returns', description: 'Unused products can be returned within 7 days.' })} className="text-left hover:text-primary" data-testid="button-footer-returns">Returns policy</button></div></div>
          <div className="rounded-2xl border border-secondary-foreground/15 bg-secondary-foreground/5 p-5"><p className="font-display text-lg">Good finds, in your inbox.</p><p className="mt-1 text-sm text-secondary-foreground/65">One thoughtful note a week. No noise.</p><div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-secondary-foreground/15 bg-secondary-foreground/10 px-3 py-2 text-sm outline-none placeholder:text-secondary-foreground/40" placeholder="Your email" aria-label="Email for newsletter" data-testid="input-newsletter" /><button onClick={() => toast({ title: 'You are on the list', description: 'Watch your inbox for the next BOLOBAN SHOP note.' })} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground" data-testid="button-newsletter">Join</button></div></div>
        </div>
        <div className="border-t border-secondary-foreground/10 px-4 py-5 text-center text-xs text-secondary-foreground/50">© 2026 BOLOBAN SHOP Bangladesh · Shop everything, simply.</div>
      </footer>
    </div>
  );
}