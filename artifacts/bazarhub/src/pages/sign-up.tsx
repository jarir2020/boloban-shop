import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, UserPlus } from 'lucide-react';
import { useAuth, type UserRole } from '@/lib/auth';

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('shopper');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ name, email, phone: phone || undefined, password, role });
      setLocation('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl md:p-9"
        data-testid="form-sign-up"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
          <ShoppingBag size={16} /> BOLOBAN SHOP
        </Link>
        <h1 className="mt-5 font-display text-4xl text-secondary">Join BOLOBAN SHOP</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your account and start shopping from trusted sellers across Bangladesh.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block text-xs font-bold text-secondary">
            Full name
            <input
              type="text"
              required
              minLength={1}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="Your name"
              data-testid="input-name"
            />
          </label>
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
            Phone <span className="text-muted-foreground">(optional)</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="01XXXXXXXXX"
              data-testid="input-phone"
            />
          </label>
          <label className="block text-xs font-bold text-secondary">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              placeholder="At least 8 characters"
              data-testid="input-password"
            />
          </label>
          <div>
            <p className="mb-2 text-xs font-bold text-secondary">I am a…</p>
            <div className="grid grid-cols-3 gap-2">
              {(['shopper', 'seller', 'admin'] as UserRole[]).map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition-colors ${
                    role === value
                      ? 'border-primary bg-primary/10 text-secondary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="sr-only"
                    data-testid={`radio-role-${value}`}
                  />
                  <span className="capitalize">{value}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
            data-testid="status-sign-up-error"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          data-testid="button-submit-sign-up"
        >
          <UserPlus size={16} /> {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-bold text-primary transition-colors hover:text-secondary"
            data-testid="link-to-sign-in"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
