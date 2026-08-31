import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { getGetProductQueryKey, getListProductReviewsQueryKey, useGetProduct, useListProductReviews } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { taka } from '@/components/product-card';
import { ErrorState } from '@/components/page-states';
import { toast } from '@/hooks/use-toast';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const productQuery = useGetProduct(id, { query: { enabled: Number.isFinite(id), queryKey: getGetProductQueryKey(id) } });
  const reviewsQuery = useListProductReviews(id, { query: { enabled: Number.isFinite(id), queryKey: getListProductReviewsQueryKey(id) } });
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const product = productQuery.data;

  if (productQuery.isLoading) return <div className="mx-auto max-w-[1100px] px-4 py-12"><div className="grid gap-8 md:grid-cols-2"><div className="aspect-square animate-pulse rounded-3xl bg-muted" /><div className="space-y-5"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="h-14 w-3/4 animate-pulse rounded bg-muted" /><div className="h-32 animate-pulse rounded bg-muted" /></div></div></div>;
  if (productQuery.isError || !product) return <div className="mx-auto max-w-[900px] px-4 py-12"><ErrorState onRetry={() => productQuery.refetch()} title="Could not find that product" /></div>;

  const addToCart = () => { addItem(product, quantity); toast({ title: 'Added to your bag', description: `${quantity} × ${product.name}` }); };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
      <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent" data-testid="link-back-products"><ArrowLeft size={16} /> Back to the market</Link>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] md:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-[hsl(40_28%_90%)] md:rounded-[2.5rem]"><img src={product.image} alt={product.name} className="h-full w-full object-cover" data-testid={`img-product-detail-${product.id}`} /><div className="absolute left-5 top-5 flex gap-2">{product.badge && <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">{product.badge}</span>}{product.discount > 0 && <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">Save {product.discount}%</span>}</div></div>
        <div className="flex flex-col justify-center">
          <p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">{product.category} · sold by {product.seller}</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.02] text-secondary md:text-6xl" data-testid="text-product-name">{product.name}</h1>
          <div className="mt-5 flex items-center gap-3"><span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-sm font-bold text-secondary"><Star size={15} className="fill-primary text-primary" /> {product.rating.toFixed(1)}</span><span className="text-sm text-muted-foreground">{product.reviews} reviews</span><span className="text-muted-foreground">·</span><span className="text-sm font-bold text-[hsl(151_35%_48%)]">{product.stock > 0 ? 'In stock' : 'Sold out'}</span></div>
          <div className="mt-7 flex items-end gap-3"><p className="font-mono-brand text-3xl font-bold text-secondary" data-testid="text-product-price">{taka(product.price)}</p>{product.originalPrice > product.price && <p className="pb-1 text-sm text-muted-foreground line-through">{taka(product.originalPrice)}</p>}</div>
          <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground" data-testid="text-product-description">{product.description || 'A lovely everyday find from a seller who cares about the details. Packed with care and sent your way.'}</p>
          <div className="mt-8 flex flex-wrap gap-3"><div className="flex items-center rounded-xl border border-border bg-card"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-3 text-muted-foreground hover:text-foreground" aria-label="Decrease quantity" data-testid="button-decrease-quantity"><Minus size={16} /></button><span className="w-8 text-center text-sm font-bold" data-testid="text-quantity">{quantity}</span><button onClick={() => setQuantity((value) => Math.min(product.stock || 1, value + 1))} className="p-3 text-muted-foreground hover:text-foreground" aria-label="Increase quantity" data-testid="button-increase-quantity"><Plus size={16} /></button></div><button onClick={addToCart} disabled={!product.stock} className="flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40" data-testid="button-detail-add-cart"><ShoppingBag size={18} /> Add to bag</button><button onClick={() => setFavorite((value) => !value)} className={`rounded-xl border p-3 transition-colors ${favorite ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card hover:border-accent'}`} aria-label="Save product" data-testid="button-detail-favorite"><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button></div>
          <div className="mt-8 grid gap-3 border-t border-border pt-6 text-xs font-bold text-muted-foreground sm:grid-cols-3"><span className="flex items-center gap-2"><Truck size={17} className="text-accent" /> Delivery nationwide</span><span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[hsl(151_35%_48%)]" /> Seller checked</span><span className="flex items-center gap-2"><Check size={17} className="text-primary" /> Easy returns</span></div>
        </div>
      </div>
      <section className="mt-16 border-t border-border pt-10"><div className="mb-6 flex items-baseline justify-between"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.2em] text-accent">From the community</p><h2 className="mt-1 font-display text-3xl text-secondary">Kind words</h2></div><span className="text-sm text-muted-foreground">{reviewsQuery.data?.length ?? 0} reviews</span></div>{reviewsQuery.isLoading ? <div className="grid gap-3 md:grid-cols-3"><div className="h-36 animate-pulse rounded-2xl bg-muted" /><div className="h-36 animate-pulse rounded-2xl bg-muted" /><div className="h-36 animate-pulse rounded-2xl bg-muted" /></div> : reviewsQuery.isError ? <ErrorState onRetry={() => reviewsQuery.refetch()} title="Reviews are taking a pause" /> : reviewsQuery.data?.length ? <div className="grid gap-3 md:grid-cols-3">{reviewsQuery.data.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`card-review-${review.id}`}><div className="flex items-center justify-between"><span className="font-bold text-secondary">{review.author}</span><span className="flex items-center gap-1 text-xs font-bold"><Star size={13} className="fill-primary text-primary" /> {review.rating}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">“{review.text}”</p><p className="mt-4 font-mono-brand text-[10px] uppercase tracking-wider text-muted-foreground">{review.date}</p></article>)}</div> : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Be the first to leave a kind word.</p>}</section>
    </div>
  );
}