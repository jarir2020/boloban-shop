import { Heart, Plus, Star, Tag } from 'lucide-react';
import { Link } from 'wouter';
import type { Product } from '@workspace/api-client-react';
import { useCart } from '@/lib/cart';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export function taka(value: number) {
  return `৳${value.toLocaleString('en-BD')}`;
}

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const { addItem } = useCart();
  const [favorite, setFavorite] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const addToCart = () => {
    addItem(product);
    toast({ title: 'Added to your bag', description: `${product.name} is ready when you are.` });
  };

  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-border bg-card soft-shadow lift ${featured ? 'md:rounded-3xl' : ''}`} data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-square overflow-hidden bg-[hsl(40_28%_90%)]">
        {imageFailed ? (
          <div className="flex h-full items-center justify-center bg-[hsl(178_31%_24%)] px-8 text-center font-display text-3xl text-primary">{product.name.slice(0, 1)}</div>
        ) : (
          <img src={product.image} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" data-testid={`img-product-${product.id}`} />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.badge && <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{product.badge}</span>}
          {product.discount > 0 && <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground">-{product.discount}%</span>}
        </div>
        <button onClick={() => setFavorite((value) => !value)} className={`absolute right-3 top-3 rounded-full p-2 backdrop-blur transition-colors ${favorite ? 'bg-accent text-accent-foreground' : 'bg-card/80 text-foreground hover:bg-primary'}`} aria-label={favorite ? 'Remove favorite' : 'Save favorite'} data-testid={`button-favorite-${product.id}`}>
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3.5 md:p-4">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"><Tag size={11} /> {product.category}</p>
        <Link href={`/products/${product.id}`} className="block" data-testid={`link-product-${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.8rem] text-sm font-bold leading-5 text-foreground transition-colors group-hover:text-accent md:text-[15px]">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star size={13} className="fill-primary text-primary" /> <span className="font-bold text-foreground">{product.rating.toFixed(1)}</span> <span>({product.reviews})</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-mono-brand text-lg font-bold text-secondary">{taka(product.price)}</p>
            {product.originalPrice > product.price && <p className="text-xs text-muted-foreground line-through">{taka(product.originalPrice)}</p>}
          </div>
          <button onClick={addToCart} disabled={product.stock < 1} className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid={`button-add-cart-${product.id}`}>
            <Plus size={14} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}