import { ArrowRight, Box, CheckCircle2, Clock3, MapPin, PackageCheck, Truck } from 'lucide-react';
import { Link } from 'wouter';
import { useListOrders } from '@workspace/api-client-react';
import { EmptyState, ErrorState } from '@/components/page-states';
import { taka } from '@/components/product-card';

const statusMeta: Record<string, { label: string; icon: typeof Clock3; tone: string }> = {
  pending: { label: 'Order received', icon: Clock3, tone: 'text-primary bg-primary/15' },
  processing: { label: 'Being packed', icon: Box, tone: 'text-accent bg-accent/15' },
  shipped: { label: 'On the road', icon: Truck, tone: 'text-[hsl(258_43%_57%)] bg-[hsl(258_43%_57%_/_0.14)]' },
  delivered: { label: 'Delivered', icon: CheckCircle2, tone: 'text-[hsl(151_35%_48%)] bg-[hsl(151_35%_48%_/_0.14)]' },
};

export default function Orders() {
  const ordersQuery = useListOrders();
  const orders = ordersQuery.data ?? [];

  return (
    <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">Your little paper trail</p><h1 className="mt-2 font-display text-5xl text-secondary md:text-6xl" data-testid="text-orders-title">My orders</h1><p className="mt-2 text-sm text-muted-foreground">A calm place to keep tabs on your good finds.</p></div><Link href="/products" className="inline-flex w-fit items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground" data-testid="link-orders-shop">Shop again <ArrowRight size={15} /></Link></div>
      {ordersQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-muted" />)}</div> : ordersQuery.isError ? <ErrorState onRetry={() => ordersQuery.refetch()} title="Your orders are out of reach" /> : orders.length === 0 ? <EmptyState title="No orders yet." detail="When you find something that feels like you, your order will be right here." action={<Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground" data-testid="link-empty-orders">Browse the market <ArrowRight size={16} /></Link>} /> : <div className="space-y-4">{orders.map((order) => { const meta = statusMeta[order.status.toLowerCase()] ?? statusMeta.pending; const StatusIcon = meta.icon; return <article key={order.id} className="overflow-hidden rounded-2xl border border-border bg-card" data-testid={`card-order-${order.id}`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><p className="font-mono-brand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order {order.id}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${meta.tone}`} data-testid={`status-order-${order.id}`}><StatusIcon size={14} /> {meta.label}</span></div><div className="grid gap-5 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex flex-wrap gap-2">{order.items.map((item) => <div key={item.productId} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary font-mono-brand text-[10px] text-primary">×{item.quantity}</span><span className="font-bold text-secondary">Product #{item.productId}</span></div>)}</div><div className="text-left md:text-right"><p className="font-mono-brand text-xl font-bold text-secondary" data-testid={`text-order-total-${order.id}`}>{taka(order.total)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground md:justify-end"><MapPin size={13} /> {order.address}</p></div></div><div className="flex items-center gap-2 border-t border-border bg-muted/50 px-5 py-3 text-xs text-muted-foreground"><PackageCheck size={15} className="text-[hsl(151_35%_48%)]" /> Thanks for shopping with people who care.</div></article>; })}</div>}
    </div>
  );
}