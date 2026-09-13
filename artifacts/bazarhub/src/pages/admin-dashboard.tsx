import { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  Edit3,
  ExternalLink,
  Filter,
  Globe,
  LogOut,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useListOrders, useListProducts } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  userBreakdown: { shoppersCount: number; sellersCount: number; adminsCount: number };
  lowStockCount: number;
}

interface UserItem {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export function AdminDashboard() {
  const { user, status, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users'>('overview');

  const ordersQuery = useListOrders();
  const productsQuery = useListProducts({ limit: 100 });

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');

  // Modals / Forms
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'electronics',
    price: '',
    originalPrice: '',
    stock: '25',
    seller: 'BOLOBAN Direct',
    badge: 'Popular',
    description: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore fallback
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch {
      // Ignore
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      void fetchUsers();
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: 'Order Updated', description: `Order ${orderId} status set to ${newStatus}.` });
        void ordersQuery.refetch();
        void fetchStats();
      } else {
        toast({ title: 'Update Failed', description: 'Could not update order status.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Update Error', description: 'Server error updating order status.', variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdateProductStock = async (productId: number, newStock: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        toast({ title: 'Stock Updated', description: `Product #${productId} stock updated to ${newStock}.` });
        void productsQuery.refetch();
        void fetchStats();
      }
    } catch {
      toast({ title: 'Update Error', description: 'Failed to update stock.', variant: 'destructive' });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast({ title: 'Missing Information', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    setCreatingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          originalPrice: Number(newProduct.originalPrice || newProduct.price),
          stock: Number(newProduct.stock),
        }),
      });
      if (res.ok) {
        toast({ title: 'Product Created', description: `Added "${newProduct.name}" to catalog.` });
        setIsAddProductOpen(false);
        setNewProduct({
          name: '',
          category: 'electronics',
          price: '',
          originalPrice: '',
          stock: '25',
          seller: 'BOLOBAN Direct',
          badge: 'Popular',
          description: '',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
        });
        void productsQuery.refetch();
        void fetchStats();
      } else {
        toast({ title: 'Creation Failed', description: 'Could not create product listing.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Server error creating product.', variant: 'destructive' });
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleSeedUsers = async () => {
    try {
      const res = await fetch('/api/dev/seed-users?key=boloban_secret_key', { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Users Seeded', description: 'Demo admin, seller, and shopper users seeded.' });
        void fetchUsers();
        void fetchStats();
      }
    } catch {
      toast({ title: 'Seed Failed', description: 'Failed to trigger seed endpoint.', variant: 'destructive' });
    }
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    let list = ordersQuery.data ?? [];
    if (orderStatusFilter !== 'all') {
      list = list.filter((o) => o.status.toLowerCase() === orderStatusFilter.toLowerCase());
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }
    return list;
  }, [ordersQuery.data, orderStatusFilter, orderSearch]);

  const filteredProducts = useMemo(() => {
    let list = productsQuery.data ?? [];
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q)
      );
    }
    return list;
  }, [productsQuery.data, productSearch]);

  // If user state is loading
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  // Access Control: Check if logged-in user has role "admin"
  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-20 text-center md:px-8">
        <div className="rounded-3xl border border-destructive/20 bg-card p-8 shadow-xl md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldCheck size={36} />
          </div>
          <h1 className="mt-5 font-display text-3xl text-secondary">Admin Access Required</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            You must be logged in with an administrator account (<code className="font-mono-brand text-xs">admin@boloban.local</code>) to view the Admin Dashboard.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
            >
              Sign in as Admin
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold text-secondary"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] pb-16">
      {/* Standalone Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-slate-100 shadow-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <img src="/boloban-shop-logo.jpg" alt="BOLOBAN SHOP" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <span className="font-display text-lg tracking-tight text-white">BOLOBAN<span className="text-amber-400"> ADMIN</span></span>
              <span className="ml-2.5 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono-brand uppercase text-amber-400">Control Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-amber-400 hover:text-white sm:inline-flex">
              <Globe size={14} /> View Storefront <ExternalLink size={12} />
            </Link>
            <div className="hidden text-right text-xs md:block">
              <strong className="block text-slate-100">{user.name || user.email}</strong>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Administrator</span>
            </div>
            <button onClick={() => void signOut()} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-600">
              <LogOut size={14} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        {/* Header Hero */}
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-lg md:flex-row md:items-center md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              <ShieldCheck size={14} /> BOLOBAN SHOP Admin Control Panel
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">Marketplace Operations</h1>
            <p className="mt-1 text-xs text-secondary-foreground/75 md:text-sm">
              Real-time analytics, order tracking, product inventory management, and platform oversight.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                void fetchStats();
                void ordersQuery.refetch();
                void productsQuery.refetch();
                toast({ title: 'Refreshed', description: 'Dashboard metrics reloaded.' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/20"
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
            >
              <PlusCircle size={15} /> Add Product
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="mb-6 flex overflow-x-auto rounded-2xl border border-border bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'overview' ? 'bg-secondary text-secondary-foreground shadow' : 'text-muted-foreground hover:text-secondary'
            }`}
          >
            <BarChart3 size={16} /> Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'orders' ? 'bg-secondary text-secondary-foreground shadow' : 'text-muted-foreground hover:text-secondary'
            }`}
          >
            <ShoppingBag size={16} /> Orders ({ordersQuery.data?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'products' ? 'bg-secondary text-secondary-foreground shadow' : 'text-muted-foreground hover:text-secondary'
            }`}
          >
            <Box size={16} /> Inventory ({productsQuery.data?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors ${
              activeTab === 'users' ? 'bg-secondary text-secondary-foreground shadow' : 'text-muted-foreground hover:text-secondary'
            }`}
          >
            <Users size={16} /> Users & System
          </button>
        </div>

        {/* ------------------- OVERVIEW TAB ------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <DollarSign size={18} />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl text-secondary">
                  ৳{statsLoading ? '...' : (stats?.totalRevenue ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRight size={13} /> Completed orders volume
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Orders</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <ShoppingBag size={18} />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl text-secondary">
                  {statsLoading ? '...' : (stats?.totalOrders ?? ordersQuery.data?.length ?? 0)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Customer transactions</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Catalog</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Box size={18} />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl text-secondary">
                  {statsLoading ? '...' : (stats?.totalProducts ?? productsQuery.data?.length ?? 0)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Products in database</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marketplace Users</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Users size={18} />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl text-secondary">
                  {statsLoading ? '...' : (stats?.totalUsers ?? 3)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats?.userBreakdown?.sellersCount ?? 1} sellers · {stats?.userBreakdown?.shoppersCount ?? 1} shoppers
                </p>
              </div>
            </div>

            {/* Quick Actions & Recent Feed */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Orders Overview */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl text-secondary">Recent Customer Orders</h2>
                    <p className="text-xs text-muted-foreground">Latest transactions placed on the marketplace</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    View All Orders <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 font-bold">Order ID</th>
                        <th className="pb-3 font-bold">Customer</th>
                        <th className="pb-3 font-bold">Total</th>
                        <th className="pb-3 font-bold">Payment</th>
                        <th className="pb-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(ordersQuery.data ?? []).slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-muted/30">
                          <td className="py-3 font-mono-brand font-bold text-secondary">{order.id}</td>
                          <td className="py-3 font-bold">{order.customerName}</td>
                          <td className="py-3 font-bold text-secondary">৳{order.total}</td>
                          <td className="py-3 uppercase text-muted-foreground">{order.paymentMethod}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : order.status === 'Shipped'
                                  ? 'bg-blue-100 text-blue-700'
                                  : order.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Alerts & Quick Tools */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle size={20} />
                    <h3 className="font-display text-lg">Low Stock Warning</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    {stats?.lowStockCount ?? 0} items currently have fewer than 10 units remaining in stock.
                  </p>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="mt-4 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                  >
                    Manage Inventory
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <h3 className="font-display text-lg text-secondary">Quick Actions</h3>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => setIsAddProductOpen(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-3 text-xs font-bold text-secondary transition-colors hover:border-primary"
                    >
                      <span className="flex items-center gap-2"><PlusCircle size={16} className="text-primary" /> Create Product Listing</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={handleSeedUsers}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-3 text-xs font-bold text-secondary transition-colors hover:border-primary"
                    >
                      <span className="flex items-center gap-2"><Database size={16} className="text-purple-600" /> Seed Demo Accounts</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------- ORDERS TAB ------------------- */}
        {activeTab === 'orders' && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl text-secondary">Customer Orders</h2>
                <p className="text-xs text-muted-foreground">Manage order status and view fulfillment details</p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order ID, name, phone..."
                    className="h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="p-3 font-bold">Order ID</th>
                    <th className="p-3 font-bold">Customer Info</th>
                    <th className="p-3 font-bold">Shipping Address</th>
                    <th className="p-3 font-bold">Total Amount</th>
                    <th className="p-3 font-bold">Payment</th>
                    <th className="p-3 font-bold">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono-brand font-bold text-secondary">{order.id}</td>
                      <td className="p-3">
                        <strong className="block text-secondary">{order.customerName}</strong>
                        <span className="text-[11px] text-muted-foreground">{order.phone}</span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-muted-foreground">{order.address}</td>
                      <td className="p-3 font-bold text-secondary">৳{order.total}</td>
                      <td className="p-3 uppercase text-muted-foreground">{order.paymentMethod}</td>
                      <td className="p-3">
                        <select
                          disabled={updatingOrderId === order.id}
                          value={order.status}
                          onChange={(e) => void handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none transition-colors ${
                            order.status === 'Delivered'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : order.status === 'Shipped'
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : order.status === 'Cancelled'
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No orders match the selected filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------- PRODUCTS TAB ------------------- */}
        {activeTab === 'products' && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl text-secondary">Product Inventory</h2>
                <p className="text-xs text-muted-foreground">Control stock counts, prices, and catalog items</p>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow"
                >
                  <PlusCircle size={15} /> Add New
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="p-3 font-bold">Product</th>
                    <th className="p-3 font-bold">Category</th>
                    <th className="p-3 font-bold">Price</th>
                    <th className="p-3 font-bold">Seller</th>
                    <th className="p-3 font-bold">Stock</th>
                    <th className="p-3 font-bold">Quick Stock Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
                          />
                          <div>
                            <strong className="block text-secondary">{product.name}</strong>
                            <span className="text-[10px] text-muted-foreground">#{product.id} · {product.badge || 'Standard'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 uppercase text-muted-foreground font-bold">{product.category}</td>
                      <td className="p-3 font-bold text-secondary">৳{product.price}</td>
                      <td className="p-3 text-muted-foreground">{product.seller}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void handleUpdateProductStock(product.id, Math.max(0, product.stock - 5))}
                            className="rounded-md border border-border px-2 py-1 text-xs font-bold hover:bg-muted"
                            title="Subtract 5 units"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => void handleUpdateProductStock(product.id, product.stock + 10)}
                            className="rounded-md border border-border px-2 py-1 text-xs font-bold hover:bg-muted"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------- USERS & SYSTEM TAB ------------------- */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-secondary">Users & Platform Accounts</h2>
                <p className="text-xs text-muted-foreground">View registered shoppers, sellers, and system roles</p>
              </div>
              <button
                onClick={handleSeedUsers}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow"
              >
                <Database size={15} /> Seed Demo Users
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="p-3 font-bold">User ID</th>
                    <th className="p-3 font-bold">Name</th>
                    <th className="p-3 font-bold">Email</th>
                    <th className="p-3 font-bold">Phone</th>
                    <th className="p-3 font-bold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono-brand font-bold text-secondary">#{u.id}</td>
                      <td className="p-3 font-bold text-secondary">{u.name}</td>
                      <td className="p-3 font-mono-brand text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-muted-foreground">{u.phone || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'seller'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------- ADD PRODUCT MODAL ------------------- */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <form
              onSubmit={(e) => void handleCreateProduct(e)}
              className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8"
            >
              <h2 className="font-display text-2xl text-secondary">Add New Product Listing</h2>
              <p className="mt-1 text-xs text-muted-foreground">Create a new item in the marketplace catalog</p>

              <div className="mt-6 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-secondary">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Wireless Smart Watch"
                    className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-secondary">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                    >
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Living</option>
                      <option value="beauty">Beauty</option>
                      <option value="groceries">Groceries</option>
                      <option value="fresh-market">Fresh Market</option>
                      <option value="lifestyle">Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-secondary">Price (৳)</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="1290"
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-secondary">Stock Quantity</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-secondary">Seller Name</label>
                    <input
                      type="text"
                      value={newProduct.seller}
                      onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-secondary">Description</label>
                  <textarea
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Short product overview..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow"
                >
                  {creatingProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

