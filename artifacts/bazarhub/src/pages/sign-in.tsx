import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { signIn, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await signIn(email, password);
      if (loggedUser.role === 'admin') {
        setLocation('/admin');
      } else if (loggedUser.role === 'seller') {
        setLocation('/seller');
      } else {
        setLocation('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl md:p-9"
        data-testid="form-sign-in"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
          <ShoppingBag size={16} /> BOLOBAN SHOP
        </Link>
        <h1 className="mt-5 font-display text-4xl text-secondary">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue shopping, track orders, and pick up where you left off.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block text-xs font-bold text-secondary">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="you@example.com"
              data-testid="input-email"
            />
          </label>
          <label className="block text-xs font-bold text-secondary">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="At least 8 characters"
              data-testid="input-password"
            />
          </label>
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
            data-testid="status-sign-in-error"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || status === 'loading'}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          data-testid="button-submit-sign-in"
        >
          <LogIn size={16} /> {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          New to BOLOBAN SHOP?{' '}
          <Link
            href="/sign-up"
            className="font-bold text-primary transition-colors hover:text-secondary"
            data-testid="link-to-sign-up"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
          Demo users:&nbsp;
          <code className="font-mono-brand text-[10px]">shopper@boloban.local</code>,
          {' '}
          <code className="font-mono-brand text-[10px]">seller@boloban.local</code>,
          {' '}
          <code className="font-mono-brand text-[10px]">admin@boloban.local</code>.
        </p>
      </form>
    </div>
  );
}
