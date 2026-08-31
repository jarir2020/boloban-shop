import { BarChart3, ChevronRight, CircleCheck, Package, Store, Users, WalletCards } from 'lucide-react';
import { Link } from 'wouter';

export function SellerSurface() {
  return <SurfaceLayout kind="seller" />;
}

export function AdminSurface() {
  return <SurfaceLayout kind="admin" />;
}

function SurfaceLayout({ kind }: { kind: 'seller' | 'admin' }) {
  const seller = kind === 'seller';
  const cards = seller ? [{ icon: WalletCards, label: 'Payouts', value: 'Coming soon' }, { icon: Package, label: 'Listings', value: 'Ready to add' }, { icon: BarChart3, label: 'Store pulse', value: 'Building' }] : [{ icon: Users, label: 'Community', value: 'Healthy' }, { icon: Package, label: 'Products', value: 'Growing daily' }, { icon: CircleCheck, label: 'Trust checks', value: 'All systems go' }];
  return <div className="mx-auto max-w-[1100px] px-4 py-10 md:px-8 md:py-16"><div className="overflow-hidden rounded-[2rem] bg-secondary text-secondary-foreground"><div className="grid gap-8 px-6 py-10 md:grid-cols-[1fr_280px] md:px-12 md:py-14"><div><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Store size={14} /> {seller ? 'Seller space' : 'BazarHub admin'}</div><h1 className="max-w-xl font-display text-5xl leading-[.98] md:text-7xl">{seller ? 'Your shop, with a pulse.' : 'Keep the market kind.'}</h1><p className="mt-5 max-w-lg text-sm leading-7 text-secondary-foreground/70">{seller ? 'A thoughtful home for your products, orders, and growing customer circle. Seller tools are being prepared for the first wave of shops.' : 'The behind-the-scenes view for keeping products fresh, sellers supported, and every order moving in the right direction.'}</p><Link href="/products" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid={`link-${kind}-browse`}>Browse the marketplace <ChevronRight size={16} /></Link></div><div className="flex items-end justify-center"><div className="w-full rounded-2xl border border-secondary-foreground/15 bg-secondary-foreground/5 p-5"><p className="font-mono-brand text-[10px] uppercase tracking-wider text-primary">Next up</p><p className="mt-3 font-display text-2xl">{seller ? 'Open your stall' : 'A clearer dashboard'}</p><p className="mt-2 text-xs leading-5 text-secondary-foreground/60">We are putting the useful bits first. No clutter, no mystery.</p></div></div></div></div><div className="mt-8 grid gap-3 md:grid-cols-3">{cards.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><Icon className="text-accent" size={20} /><p className="mt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl text-secondary">{value}</p></div>)}</div></div>;
}