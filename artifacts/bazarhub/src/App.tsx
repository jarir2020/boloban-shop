import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { MarketShell } from '@/components/market-shell';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Products from '@/pages/products';
import FreshMarket from '@/pages/fresh-market';
import ProductDetail from '@/pages/product-detail';
import Cart from '@/pages/cart';
import Orders from '@/pages/orders';
import Account from '@/pages/account';
import { AdminSurface, SellerSurface } from '@/pages/surface';
import SignIn from '@/pages/sign-in';
import SignUp from '@/pages/sign-up';
import {
  Route,
  Switch,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/fresh-market" component={FreshMarket} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/orders" component={Orders} />
        <Route path="/account" component={Account} />
        <Route path="/seller" component={SellerSurface} />
        <Route path="/admin" component={AdminSurface} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WouterRouter base={basePath}>
              <Switch>
                <Route path="/sign-in/*?" component={SignIn} />
                <Route path="/sign-up/*?" component={SignUp} />
                <Route component={() => <MarketShell><Router /></MarketShell>} />
              </Switch>
            </WouterRouter>
          </CartProvider>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
