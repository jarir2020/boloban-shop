import { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Box,
  ChevronRight,
  Database,
  DollarSign,
  Edit3,
  ExternalLink,
  FolderTree,
  Globe,
  Image as ImageIcon,
  Layers,
  LogOut,
  Menu,
  Palette,
  PlusCircle,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Moon,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useListOrders, useListProducts, useListCategories } from '@workspace/api-client-react';
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

interface ColorItem {
  id: number;
  name: string;
  hex: string;
}

interface SizeItem {
  id: number;
  label: string;
  category: string;
}

export function AdminDashboard() {
  const { user, status, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'colors' | 'sizes' | 'orders' | 'users'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('boloban-admin-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('boloban-admin-theme', nextTheme);
  };

  const ordersQuery = useListOrders();
  const productsQuery = useListProducts({ limit: 200 });
  const categoriesQuery = useListCategories();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [colorsList, setColorsList] = useState<ColorItem[]>([]);
  const [sizesList, setSizesList] = useState<SizeItem[]>([]);

  // Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Modals & Product Form State
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'electronics',
    price: '',
    originalPrice: '',
    stock: '25',
    seller: 'BOLOBAN Direct',
    badge: 'Popular',
    description: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
    additionalImages: '', // newline separated image URLs
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: '', name: '', nameBn: '', icon: '◒' });

  // Color Modal State
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });

  // Size Modal State
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [newSize, setNewSize] = useState({ label: '', category: 'Apparel' });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // Fallback
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsersList(await res.json());
    } catch {
      // Fallback
    }
  };

  const fetchColors = async () => {
    try {
      const res = await fetch('/api/colors');
      if (res.ok) setColorsList(await res.json());
    } catch {
      // Fallback
    }
  };

  const fetchSizes = async () => {
    try {
      const res = await fetch('/api/sizes');
      if (res.ok) setSizesList(await res.json());
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    void fetchStats();
    void fetchColors();
    void fetchSizes();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') void fetchUsers();
  }, [activeTab]);

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast({ title: 'Validation Error', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    setSubmittingProduct(true);
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice || productForm.price),
        stock: Number(productForm.stock),
        seller: productForm.seller,
        badge: productForm.badge,
        description: productForm.description,
        image: productForm.image,
      };

      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: editingProductId ? 'Product Updated' : 'Product Created',
          description: `Successfully saved "${productForm.name}".`,
        });
        setIsAddProductOpen(false);
        setEditingProductId(null);
        void productsQuery.refetch();
        void fetchStats();
      } else {
        toast({ title: 'Error', description: 'Failed to save product.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Server error saving product.', variant: 'destructive' });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Product Deleted', description: `Removed "${name}" from catalog.` });
        void productsQuery.refetch();
        void fetchStats();
      }
    } catch {
      toast({ title: 'Error', description: 'Could not delete product.', variant: 'destructive' });
    }
  };

  const openEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      originalPrice: String(p.originalPrice || p.price),
      stock: String(p.stock),
      seller: p.seller || 'BOLOBAN Direct',
      badge: p.badge || '',
      description: p.description || '',
      image: p.image || '',
      additionalImages: '',
    });
    setIsAddProductOpen(true);
  };

  // Category CRUD
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      if (res.ok) {
        toast({ title: 'Category Created', description: `Added category "${newCategory.name}".` });
        setIsAddCategoryOpen(false);
        setNewCategory({ id: '', name: '', nameBn: '', icon: '◒' });
        void categoriesQuery.refetch();
      }
    } catch {
      toast({ title: 'Error', description: 'Could not create category.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Category Removed', description: `Deleted category "${name}".` });
        void categoriesQuery.refetch();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' });
    }
  };

  // Color CRUD
  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColor.name || !newColor.hex) return;
    try {
      const res = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColor),
      });
      if (res.ok) {
        toast({ title: 'Color Added', description: `Added color variant "${newColor.name}".` });
        setIsAddColorOpen(false);
        setNewColor({ name: '', hex: '#000000' });
        void fetchColors();
      }
    } catch {
      toast({ title: 'Error', description: 'Could not add color.', variant: 'destructive' });
    }
  };

  const handleDeleteColor = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/colors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Color Removed', description: `Deleted color "${name}".` });
        void fetchColors();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete color.', variant: 'destructive' });
    }
  };

  // Size CRUD
  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSize.label) return;
    try {
      const res = await fetch('/api/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSize),
      });
      if (res.ok) {
        toast({ title: 'Size Added', description: `Added size variant "${newSize.label}".` });
        setIsAddSizeOpen(false);
        setNewSize({ label: '', category: 'Apparel' });
        void fetchSizes();
      }
    } catch {
      toast({ title: 'Error', description: 'Could not add size.', variant: 'destructive' });
    }
  };

  const handleDeleteSize = async (id: number, label: string) => {
    try {
      const res = await fetch(`/api/sizes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Size Removed', description: `Deleted size "${label}".` });
        void fetchSizes();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete size.', variant: 'destructive' });
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: 'Order Status Updated', description: `Order ${orderId} is now ${newStatus}.` });
        void ordersQuery.refetch();
        void fetchStats();
      }
    } catch {
      toast({ title: 'Error', description: 'Server error updating status.', variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
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

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <RefreshCw className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  // Access Control: Must be admin role
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldCheck size={36} />
          </div>
          <h1 className="mt-5 font-display text-3xl">Admin Access Required</h1>
          <p className="mt-3 text-xs leading-6 text-slate-400">
            Please log in with administrator credentials (<code className="font-mono-brand text-amber-400">admin@boloban.local</code>) to access the control panel.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sign-in" className="rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400">
              Sign in as Admin
            </Link>
            <Link href="/" className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold text-slate-300">
              Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm';
  const cardInnerBg = isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const textHead = isDark ? 'text-white' : 'text-slate-900';
  const tableHeaderBg = isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700';
  const inputBg = isDark ? 'border-slate-800 bg-slate-950 text-white focus:border-amber-400' : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500';
  const modalBg = isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 shadow-2xl';

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* ------------------- LEFT SIDEBAR ------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform md:static md:translate-x-0 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-md'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-16 items-center justify-between border-b px-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <img src="/boloban-shop-logo.jpg" alt="BOLOBAN SHOP" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-display text-lg tracking-tight">BOLOBAN <span className="text-amber-500">ADMIN</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={`md:hidden ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 text-xs font-bold">
          <div className={`px-3 pb-2 text-[10px] uppercase tracking-wider ${textSub}`}>Main Control</div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={18} /> Dashboard Overview
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-3"><Box size={18} /> Products & Images</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono-brand ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-900'}`}>{productsQuery.data?.length ?? 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-3"><FolderTree size={18} /> Categories CRUD</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono-brand ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-900'}`}>{categoriesQuery.data?.length ?? 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'colors'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-3"><Palette size={18} /> Colors Variants</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono-brand ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-900'}`}>{colorsList.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('sizes')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'sizes'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-3"><Ruler size={18} /> Sizes Variants</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono-brand ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-900'}`}>{sizesList.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-3"><ShoppingBag size={18} /> Orders & Fulfillment</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono-brand ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-900'}`}>{ordersQuery.data?.length ?? 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users size={18} /> Platform Accounts
          </button>
        </div>

        <div className={`border-t p-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <Link
            href="/"
            target="_blank"
            className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition-colors ${
              isDark ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-400 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2"><Globe size={16} className="text-amber-500" /> View Storefront</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>

      {/* ------------------- MAIN CONTENT AREA ------------------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className={`flex h-16 items-center justify-between border-b px-6 backdrop-blur ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/80'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`md:hidden ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <Menu size={22} />
            </button>
            <h1 className="font-display text-lg tracking-tight uppercase">{activeTab} Section</h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-colors ${
                isDark ? 'border-slate-800 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-amber-600 hover:bg-slate-200'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <div className="hidden text-right md:block">
              <strong className="block">{user.name || user.email}</strong>
              <span className="text-[10px] font-bold uppercase text-amber-500">Administrator</span>
            </div>

            <button
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-600"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </header>

        {/* Dynamic Section View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* ------------------- 1. OVERVIEW TAB ------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className={`flex items-center justify-between ${textSub}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                    <DollarSign size={20} className="text-emerald-500" />
                  </div>
                  <p className="mt-3 font-display text-3xl text-emerald-500">৳{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
                  <p className={`mt-1 text-[11px] ${textSub}`}>Gross sales volume</p>
                </div>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className={`flex items-center justify-between ${textSub}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                    <ShoppingBag size={20} className="text-amber-500" />
                  </div>
                  <p className="mt-3 font-display text-3xl text-amber-500">{ordersQuery.data?.length ?? 0}</p>
                  <p className={`mt-1 text-[11px] ${textSub}`}>Customer checkout orders</p>
                </div>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className={`flex items-center justify-between ${textSub}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">Products Catalog</span>
                    <Box size={20} className="text-blue-500" />
                  </div>
                  <p className="mt-3 font-display text-3xl text-blue-500">{productsQuery.data?.length ?? 0}</p>
                  <p className={`mt-1 text-[11px] ${textSub}`}>Active marketplace listings</p>
                </div>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className={`flex items-center justify-between ${textSub}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
                    <FolderTree size={20} className="text-purple-500" />
                  </div>
                  <p className="mt-3 font-display text-3xl text-purple-500">{categoriesQuery.data?.length ?? 0}</p>
                  <p className={`mt-1 text-[11px] ${textSub}`}>Product categories</p>
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className={`rounded-2xl border p-6 ${cardBg}`}>
                  <h3 className={`font-display text-xl ${textHead}`}>Inventory Quick Actions</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm({ name: '', category: 'electronics', price: '', originalPrice: '', stock: '25', seller: 'BOLOBAN Direct', badge: 'Popular', description: '', image: '', additionalImages: '' });
                        setIsAddProductOpen(true);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 p-3.5 text-xs font-bold text-slate-950 transition-transform hover:scale-105"
                    >
                      <PlusCircle size={18} /> Add New Product
                    </button>

                    <button
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs font-bold text-white hover:border-amber-400"
                    >
                      <FolderTree size={18} className="text-amber-400" /> Add Category
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="font-display text-xl text-white">Variants Controls</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsAddColorOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs font-bold text-white hover:border-amber-400"
                    >
                      <Palette size={18} className="text-rose-400" /> Add Color Swatch
                    </button>

                    <button
                      onClick={() => setIsAddSizeOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs font-bold text-white hover:border-amber-400"
                    >
                      <Ruler size={18} className="text-blue-400" /> Add Size Option
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------- 2. PRODUCTS TAB (CRUD + IMAGES) ------------------- */}
          {activeTab === 'products' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Products Management</h2>
                  <p className="text-xs text-slate-400">Add, edit, or remove products and manage image galleries</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="h-10 rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({ name: '', category: 'electronics', price: '', originalPrice: '', stock: '25', seller: 'BOLOBAN Direct', badge: 'Popular', description: '', image: '', additionalImages: '' });
                      setIsAddProductOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400"
                  >
                    <PlusCircle size={16} /> Add Product
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="p-3 font-bold">Image & Product</th>
                      <th className="p-3 font-bold">Category</th>
                      <th className="p-3 font-bold">Price</th>
                      <th className="p-3 font-bold">Stock</th>
                      <th className="p-3 font-bold">Seller</th>
                      <th className="p-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredProducts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="h-12 w-12 shrink-0 rounded-xl border border-slate-700 object-cover" />
                            <div>
                              <strong className="block font-bold text-slate-100">{p.name}</strong>
                              <span className="text-[10px] text-slate-400">#{p.id} · {p.badge || 'Standard'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-bold uppercase text-amber-400">{p.category}</td>
                        <td className="p-3 font-bold text-emerald-400">৳{p.price}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${p.stock < 10 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {p.stock} in stock
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{p.seller}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditProduct(p)} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-amber-400 hover:text-amber-400" title="Edit Product">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => void handleDeleteProduct(p.id, p.name)} className="rounded-lg border border-slate-700 p-2 text-rose-400 hover:border-rose-500 hover:bg-rose-500/10" title="Delete Product">
                              <Trash2 size={15} />
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

          {/* ------------------- 3. CATEGORIES TAB (CRUD) ------------------- */}
          {activeTab === 'categories' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Categories Management</h2>
                  <p className="text-xs text-slate-400">Create, view, and remove product categories</p>
                </div>
                <button onClick={() => setIsAddCategoryOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400">
                  <PlusCircle size={16} /> New Category
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(categoriesQuery.data ?? []).map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-amber-400">{cat.icon || '◒'}</span>
                      <div>
                        <strong className="block text-sm text-slate-100">{cat.name}</strong>
                        <span className="text-xs text-slate-400">{cat.nameBn} · ID: <code className="font-mono-brand text-amber-400">{cat.id}</code></span>
                      </div>
                    </div>
                    <button onClick={() => void handleDeleteCategory(cat.id, cat.name)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------- 4. COLORS TAB (CRUD) ------------------- */}
          {activeTab === 'colors' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Product Color Variants</h2>
                  <p className="text-xs text-slate-400">Manage available color options for products</p>
                </div>
                <button onClick={() => setIsAddColorOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400">
                  <PlusCircle size={16} /> Add Color
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {colorsList.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full border-2 border-slate-700 shadow" style={{ backgroundColor: c.hex }} />
                      <div>
                        <strong className="block text-sm text-slate-100">{c.name}</strong>
                        <span className="font-mono-brand text-xs text-slate-400">{c.hex}</span>
                      </div>
                    </div>
                    <button onClick={() => void handleDeleteColor(c.id, c.name)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------- 5. SIZES TAB (CRUD) ------------------- */}
          {activeTab === 'sizes' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Product Size Variants</h2>
                  <p className="text-xs text-slate-400">Manage sizing options (Apparel, Footwear, etc.)</p>
                </div>
                <button onClick={() => setIsAddSizeOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400">
                  <PlusCircle size={16} /> Add Size
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sizesList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div>
                      <strong className="block text-base font-bold text-amber-400">{s.label}</strong>
                      <span className="text-xs text-slate-400">{s.category}</span>
                    </div>
                    <button onClick={() => void handleDeleteSize(s.id, s.label)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------- 6. ORDERS TAB ------------------- */}
          {activeTab === 'orders' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Orders & Fulfillment</h2>
                  <p className="text-xs text-slate-400">Track and update customer order status</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, name..."
                    className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 outline-none"
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
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="p-3 font-bold">Order ID</th>
                      <th className="p-3 font-bold">Customer</th>
                      <th className="p-3 font-bold">Total</th>
                      <th className="p-3 font-bold">Payment</th>
                      <th className="p-3 font-bold">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredOrders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono-brand font-bold text-amber-400">{o.id}</td>
                        <td className="p-3 font-bold text-slate-200">{o.customerName} <span className="block text-[10px] text-slate-400">{o.phone}</span></td>
                        <td className="p-3 font-bold text-emerald-400">৳{o.total}</td>
                        <td className="p-3 uppercase text-slate-400">{o.paymentMethod}</td>
                        <td className="p-3">
                          <select
                            disabled={updatingOrderId === o.id}
                            value={o.status}
                            onChange={(e) => void handleUpdateOrderStatus(o.id, e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-amber-400 outline-none"
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
              </div>
            </div>
          )}

          {/* ------------------- 7. USERS TAB ------------------- */}
          {activeTab === 'users' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white">Registered Accounts</h2>
                  <p className="text-xs text-slate-400">Marketplace registered user profiles</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="p-3 font-bold">User ID</th>
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono-brand text-slate-400">#{u.id}</td>
                        <td className="p-3 font-bold text-slate-200">{u.name}</td>
                        <td className="p-3 font-mono-brand text-slate-300">{u.email}</td>
                        <td className="p-3">
                          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">{u.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ------------------- ADD / EDIT PRODUCT MODAL (WITH MULTI-IMAGES) ------------------- */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleSaveProduct(e)} className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl md:p-8">
            <h2 className="font-display text-2xl text-white">{editingProductId ? 'Edit Product' : 'Create Product Listing'}</h2>
            <p className="mt-1 text-xs text-slate-400">Fill in product specifications and image URLs</p>

            <div className="mt-6 space-y-3.5 text-xs text-slate-200">
              <div>
                <label className="block font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                  >
                    {(categoriesQuery.data ?? []).map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold">Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold">Stock Count</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold">Badge Label</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold">Primary Image URL</label>
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400 font-mono-brand text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold">Additional Image URLs (One URL per line)</label>
                <textarea
                  rows={2}
                  value={productForm.additionalImages}
                  onChange={(e) => setProductForm({ ...productForm, additionalImages: e.target.value })}
                  placeholder="https://image2.jpg&#10;https://image3.jpg"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 outline-none focus:border-amber-400 font-mono-brand text-[11px]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddProductOpen(false)} className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300">
                Cancel
              </button>
              <button type="submit" disabled={submittingProduct} className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400">
                {submittingProduct ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------- ADD CATEGORY MODAL ------------------- */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleAddCategory(e)} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-xs text-white">
            <h2 className="font-display text-2xl text-white">Create New Category</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block font-bold">Category Name (Bengali)</label>
                <input
                  type="text"
                  value={newCategory.nameBn}
                  onChange={(e) => setNewCategory({ ...newCategory, nameBn: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="rounded-xl border border-slate-800 px-4 py-2 font-bold text-slate-300">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------- ADD COLOR MODAL ------------------- */}
      {isAddColorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleAddColor(e)} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-xs text-white">
            <h2 className="font-display text-2xl text-white">Add Color Variant</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Color Name</label>
                <input
                  type="text"
                  required
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  placeholder="e.g. Midnight Black"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block font-bold">Color Swatch (Hex Code)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="h-10 w-12 rounded-lg border border-slate-800 bg-slate-950 p-1"
                  />
                  <input
                    type="text"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="h-10 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono-brand outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddColorOpen(false)} className="rounded-xl border border-slate-800 px-4 py-2 font-bold text-slate-300">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">
                Save Color
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------- ADD SIZE MODAL ------------------- */}
      {isAddSizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleAddSize(e)} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-xs text-white">
            <h2 className="font-display text-2xl text-white">Add Size Option</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Size Label</label>
                <input
                  type="text"
                  required
                  value={newSize.label}
                  onChange={(e) => setNewSize({ ...newSize, label: e.target.value })}
                  placeholder="e.g. XL or 42"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block font-bold">Size Category</label>
                <select
                  value={newSize.category}
                  onChange={(e) => setNewSize({ ...newSize, category: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 outline-none focus:border-amber-400"
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Footwear">Footwear</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddSizeOpen(false)} className="rounded-xl border border-slate-800 px-4 py-2 font-bold text-slate-300">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">
                Save Size
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
