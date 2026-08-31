import { useState, type FormEvent, type ReactNode } from 'react';
import { Bell, ChevronDown, Heart, Menu, Search, ShoppingBag, Store, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { toast } from '@/hooks/use-toast';

const links = [
  { href: '/', label: 'Discover' },
  { href: '/products', label: 'Shop all' },
  { href: '/orders', label: 'My orders' },
];

export function MarketShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { count } = useCart();
  const { data: health } = useHealthCheck();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');

  const search = (event: FormEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    setLocation(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      <div className="bg-secondary px-4 py-2 text-center text-[11px] font-bold tracking-wide text-secondary-foreground">
        Fresh finds from Bangladesh, delivered with care <span className="mx-2 text-primary">•</span> Cash on delivery available
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2" data-testid="link-logo">
            <span className="flex h-10 w-10 rotate-3 items-center justify-center rounded-xl bg-primary font-display text-2xl text-primary-foreground transition-transform group-hover:rotate-[-3deg]">B</span>
            <span className="hidden font-display text-2xl tracking-tight sm:block">Bazar<span className="text-accent">Hub</span></span>
          </Link>
          <form onSubmit={search} className="relative min-w-0 flex-1 md:max-w-xl" data-testid="form-search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for rice, skincare, good things..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-12 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15" aria-label="Search products" data-testid="input-search" />
            <button type="submit" className="absolute right-1.5 top-1.5 rounded-lg bg-primary p-2 text-primary-foreground transition-transform hover:scale-105" aria-label="Submit search" data-testid="button-submit-search"><Search size={16} /></button>
          </form>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors hover:bg-primary/20 ${location === link.href ? 'text-accent' : 'text-foreground'}`} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</Link>)}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
            <button onClick={() => toast({ title: 'Your favorites', description: 'Favorite products will appear here as you save them.' })} className="hidden rounded-xl p-2.5 text-foreground transition-colors hover:bg-primary/20 sm:block" aria-label="Favorites" data-testid="button-favorites"><Heart size={19} /></button>
            <button onClick={() => toast({ title: 'You are all caught up', description: 'No new market updates right now.' })} className="hidden rounded-xl p-2.5 text-foreground transition-colors hover:bg-primary/20 sm:block" aria-label="Notifications" data-testid="button-notifications"><Bell size={19} /></button>
            <Link href="/cart" className="relative rounded-xl p-2.5 text-foreground transition-colors hover:bg-primary/20" aria-label={`Cart with ${count} items`} data-testid="link-cart">
              <ShoppingBag size={20} />
              {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground" data-testid="text-cart-count">{count}</span>}
            </Link>
            <button onClick={() => toast({ title: 'Welcome back', description: 'Account sign-in is coming soon. You can shop without an account.' })} className="hidden items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-bold transition-colors hover:border-primary hover:bg-primary/10 md:flex" data-testid="button-account"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-primary">A</span> Account <ChevronDown size={14} /></button>
            <button onClick={() => setMenuOpen((value) => !value)} className="rounded-xl p-2.5 text-foreground hover:bg-primary/20 lg:hidden" aria-label="Toggle menu" data-testid="button-menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-bold hover:bg-primary/15" data-testid={`link-mobile-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</Link>)}
            <Link href="/seller" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-bold hover:bg-primary/15" data-testid="link-mobile-sell"><Store size={16} /> Sell on BazarHub</Link>
          </div>
        </div>}
      </header>
      {health?.status && <div className="mx-auto hidden max-w-[1440px] items-center justify-end gap-1.5 px-8 pt-3 text-[10px] font-mono-brand uppercase tracking-wider text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(151_35%_48%)]" /> Market live</div>}
      <main>{children}</main>
      <footer className="mt-20 bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:px-8">
          <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-xl text-primary-foreground">B</span><span className="font-display text-xl">BazarHub</span></div><p className="mt-4 max-w-xs text-sm leading-6 text-secondary-foreground/70">The everyday marketplace for the little things that make home feel like home.</p></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Explore</p><div className="grid gap-2 text-sm text-secondary-foreground/75"><Link href="/products" className="hover:text-primary" data-testid="link-footer-shop">Shop all</Link><Link href="/orders" className="hover:text-primary" data-testid="link-footer-orders">Track an order</Link><Link href="/seller" className="hover:text-primary" data-testid="link-footer-sell">Sell with us</Link></div></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">We care</p><div className="grid gap-2 text-sm text-secondary-foreground/75"><button onClick={() => toast({ title: 'Help is on the way', description: 'Our care team is available every day, 9am–9pm.' })} className="text-left hover:text-primary" data-testid="button-footer-help">Help center</button><button onClick={() => toast({ title: 'Easy returns', description: 'Unused products can be returned within 7 days.' })} className="text-left hover:text-primary" data-testid="button-footer-returns">Returns policy</button></div></div>
          <div className="rounded-2xl border border-secondary-foreground/15 bg-secondary-foreground/5 p-5"><p className="font-display text-lg">Good finds, in your inbox.</p><p className="mt-1 text-sm text-secondary-foreground/65">One thoughtful note a week. No noise.</p><div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-secondary-foreground/15 bg-secondary-foreground/10 px-3 py-2 text-sm outline-none placeholder:text-secondary-foreground/40" placeholder="Your email" aria-label="Email for newsletter" data-testid="input-newsletter" /><button onClick={() => toast({ title: 'You are on the list', description: 'Watch your inbox for the next BazarHub note.' })} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground" data-testid="button-newsletter">Join</button></div></div>
        </div>
        <div className="border-t border-secondary-foreground/10 px-4 py-5 text-center text-xs text-secondary-foreground/50">© 2024 BazarHub Bangladesh · Made for everyday Bangladesh</div>
      </footer>
    </div>
  );
}