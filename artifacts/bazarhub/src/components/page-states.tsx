import { AlertTriangle, PackageOpen, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

export function ProductSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5" data-testid="loading-products">
      {Array.from({ length: count }).map((_, index) => (
        <div className="overflow-hidden rounded-2xl border border-border bg-card" key={index}>
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, title = 'That did not load' }: { onRetry: () => void; title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-16 text-center" data-testid="error-state">
      <div className="mb-4 rounded-2xl bg-accent/15 p-4 text-accent"><AlertTriangle size={26} /></div>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The market stall is taking a quick break. Try again in a moment.</p>
      <button onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-retry">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center" data-testid="empty-state">
      <div className="mb-4 rounded-2xl bg-primary/20 p-4 text-secondary"><PackageOpen size={28} /></div>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>
      {action}
    </div>
  );
}