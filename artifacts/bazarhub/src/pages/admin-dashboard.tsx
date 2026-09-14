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
  Upload,
  User,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useListOrders, useListProducts, useListCategories } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';
import { AdminDataTable, ColumnDef } from '@/components/admin-data-table';

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
  name: string;
  email: string;
  role: string;
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
  const { user, status, signOut, refresh: refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'colors' | 'sizes' | 'orders' | 'users' | 'profile'>('overview');
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
    discountRate: '0',
    stock: '25',
    seller: 'BOLOBAN Direct',
    badge: 'Popular',
    description: '',
    image: '',
    additionalImages: '',
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

  // Admin Profile & Dropdown State
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    imageUrl: user?.imageUrl || '',
    password: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        imageUrl: user.imageUrl || '',
        password: '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          imageUrl: profileForm.imageUrl,
          ...(profileForm.password ? { password: profileForm.password } : {}),
        }),
      });
      if (res.ok) {
        toast({ title: 'Profile Updated', description: 'Admin profile information updated successfully.' });
        setProfileForm((prev) => ({ ...prev, password: '' }));
        await refreshUser();
      } else {
        const data = await res.json();
        toast({ title: 'Update Failed', description: data.error || 'Failed to update profile.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not connect to server.', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

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

  // Image Upload Handlers with Compression to prevent 413 Content Too Large errors
  const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.70): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePrimaryImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setProductForm(prev => ({ ...prev, image: base64 }));
    } catch {
      toast({ title: 'Upload Error', description: 'Failed to process image file.', variant: 'destructive' });
    }
  };

  const handleAdditionalImagesFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    try {
      const compressedImages = await Promise.all(fileArray.map(file => compressImageFile(file)));
      setProductForm(prev => {
        const existing = prev.additionalImages ? prev.additionalImages.split('\n').filter(Boolean) : [];
        const combined = [...existing, ...compressedImages];
        return { ...prev, additionalImages: combined.join('\n') };
      });
    } catch {
      toast({ title: 'Upload Error', description: 'Failed to process image files.', variant: 'destructive' });
    }
  };

  const removeAdditionalImage = (indexToRemove: number) => {
    setProductForm(prev => {
      const existing = prev.additionalImages ? prev.additionalImages.split('\n').filter(Boolean) : [];
      const updated = existing.filter((_, i) => i !== indexToRemove);
      return { ...prev, additionalImages: updated.join('\n') };
    });
  };

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast({ title: 'Validation Error', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    if (!productForm.image) {
      toast({ title: 'Validation Error', description: 'Please upload a primary product image file.', variant: 'destructive' });
      return;
    }
    setSubmittingProduct(true);
    try {
      const priceVal = Number(productForm.price);
      const discountVal = Number(productForm.discountRate || 0);
      const calculatedOriginalPrice = discountVal > 0 && discountVal < 100
        ? Math.round(priceVal / (1 - discountVal / 100))
        : Number(productForm.originalPrice || priceVal);

      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: priceVal,
        originalPrice: calculatedOriginalPrice,
        discount: discountVal,
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
    const computedDiscount = p.discount
      ? String(p.discount)
      : (p.originalPrice && p.originalPrice > p.price)
      ? String(Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100))
      : '0';

    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      originalPrice: String(p.originalPrice || p.price),
      discountRate: computedDiscount,
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
        <div className={`flex h-16 items-center justify-between border-b px-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <img src="/boloban-shop-logo.jpg" alt="BOLOBAN SHOP" className="h-8 w-8 rounded-lg object-cover" />
            <div>
              <span className="block font-display text-base tracking-tight leading-none">BOLOBAN <span className="text-amber-500">ADMIN</span></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Administrator</span>
            </div>
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

            {/* Admin Avatar Ring with Profile & Signout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 rounded-2xl p-1 transition-colors hover:opacity-90 outline-none"
              >
                <img
                  src={
                    user.imageUrl ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || 'Admin')}&backgroundColor=f57224`
                  }
                  alt={user.name || 'Admin'}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900 shadow-md"
                />
                <div className="hidden text-left md:block">
                  <strong className="block leading-tight">{user.name || user.email}</strong>
                  <span className="text-[10px] font-bold uppercase text-amber-500">Administrator</span>
                </div>
                <ChevronRight size={14} className={`hidden md:block transition-transform ${isProfileDropdownOpen ? 'rotate-90' : ''} ${textSub}`} />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div
                    className={`absolute right-0 z-50 mt-2 w-56 rounded-2xl border p-2 shadow-2xl transition-all ${
                      isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <div className="border-b px-3 py-2 text-xs mb-1 border-slate-800/20">
                      <p className="font-bold truncate">{user.name || 'Admin'}</p>
                      <p className={`text-[10px] truncate ${textSub}`}>{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-amber-500 text-slate-950'
                          : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <User size={16} className="text-amber-500" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
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
                        setProductForm({ name: '', category: 'electronics', price: '', originalPrice: '', discountRate: '0', stock: '25', seller: 'BOLOBAN Direct', badge: 'Popular', description: '', image: '', additionalImages: '' });
                        setIsAddProductOpen(true);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 p-3.5 text-xs font-bold text-slate-950 transition-transform hover:scale-105"
                    >
                      <PlusCircle size={18} /> Add New Product
                    </button>

                    <button
                      onClick={() => setIsAddCategoryOpen(true)}
                      className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition-colors ${
                        isDark ? 'border-slate-700 bg-slate-800 text-white hover:border-amber-400' : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-amber-500'
                      }`}
                    >
                      <FolderTree size={18} className="text-amber-500" /> Add Category
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${cardBg}`}>
                  <h3 className={`font-display text-xl ${textHead}`}>Variants Controls</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsAddColorOpen(true)}
                      className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition-colors ${
                        isDark ? 'border-slate-700 bg-slate-800 text-white hover:border-amber-400' : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-amber-500'
                      }`}
                    >
                      <Palette size={18} className="text-rose-500" /> Add Color Swatch
                    </button>

                    <button
                      onClick={() => setIsAddSizeOpen(true)}
                      className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition-colors ${
                        isDark ? 'border-slate-700 bg-slate-800 text-white hover:border-amber-400' : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-amber-500'
                      }`}
                    >
                      <Ruler size={18} className="text-blue-500" /> Add Size Option
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------- 2. PRODUCTS TAB (CRUD + IMAGES) ------------------- */}
          {activeTab === 'products' && (
            <AdminDataTable
              title="Products Management"
              subtitle="Add, edit, or remove products and manage image galleries"
              data={productsQuery.data ?? []}
              isDark={isDark}
              onAddClick={() => {
                setEditingProductId(null);
                setProductForm({ name: '', category: 'electronics', price: '', originalPrice: '', discountRate: '0', stock: '25', seller: 'BOLOBAN Direct', badge: 'Popular', description: '', image: '', additionalImages: '' });
                setIsAddProductOpen(true);
              }}
              addLabel="Add Product"
              searchPlaceholder="Search products by name, seller, category..."
              columns={[
                {
                  header: 'Image & Product',
                  sortable: true,
                  accessorKey: 'name',
                  exportValue: (p: any) => p.name,
                  cell: (p: any) => (
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className={`h-12 w-12 shrink-0 rounded-xl border object-cover ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                      <div>
                        <strong className={`block font-bold ${textHead}`}>{p.name}</strong>
                        <span className={`text-[10px] ${textSub}`}>#{p.id} · {p.badge || 'Standard'}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Category',
                  sortable: true,
                  accessorKey: 'category',
                  cell: (p: any) => <span className="font-bold uppercase text-amber-500">{p.category}</span>,
                },
                {
                  header: 'Price',
                  sortable: true,
                  accessorKey: 'price',
                  exportValue: (p: any) => `৳${p.price}`,
                  cell: (p: any) => (
                    <div>
                      <span className="font-bold text-emerald-500">৳{p.price}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className={`block text-[10px] line-through ${textSub}`}>৳{p.originalPrice}</span>
                      )}
                    </div>
                  ),
                },
                {
                  header: 'Discount',
                  sortable: true,
                  accessorKey: 'discount',
                  exportValue: (p: any) => p.discount ? `${p.discount}% OFF` : 'No Discount',
                  cell: (p: any) => {
                    const discountVal = p.discount || (p.originalPrice && p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
                    return discountVal > 0 ? (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                        {discountVal}% OFF
                      </span>
                    ) : (
                      <span className={`text-[10px] ${textSub}`}>—</span>
                    );
                  },
                },
                {
                  header: 'Stock',
                  sortable: true,
                  accessorKey: 'stock',
                  exportValue: (p: any) => `${p.stock} in stock`,
                  cell: (p: any) => (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${p.stock < 10 ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'}`}>
                      {p.stock} in stock
                    </span>
                  ),
                },
                {
                  header: 'Seller',
                  sortable: true,
                  accessorKey: 'seller',
                  cell: (p: any) => <span className={textSub}>{p.seller}</span>,
                },
                {
                  header: 'Actions',
                  cell: (p: any) => (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProduct(p)} className={`rounded-lg border p-2 ${isDark ? 'border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-400' : 'border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600'}`} title="Edit Product">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => void handleDeleteProduct(p.id, p.name)} className="rounded-lg border border-slate-700 p-2 text-rose-500 hover:border-rose-500 hover:bg-rose-500/10" title="Delete Product">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 3. CATEGORIES TAB (CRUD) ------------------- */}
          {activeTab === 'categories' && (
            <AdminDataTable
              title="Categories Management"
              subtitle="Create, view, and remove product categories"
              data={categoriesQuery.data ?? []}
              isDark={isDark}
              onAddClick={() => setIsAddCategoryOpen(true)}
              addLabel="New Category"
              searchPlaceholder="Search categories..."
              columns={[
                {
                  header: 'Category ID',
                  sortable: true,
                  accessorKey: 'id',
                  cell: (c: any) => <code className="font-mono-brand font-bold text-amber-500">{c.id}</code>,
                },
                {
                  header: 'Icon',
                  cell: (c: any) => (
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-amber-500 ${isDark ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                      {c.icon || '◒'}
                    </span>
                  ),
                },
                {
                  header: 'Category Name (EN)',
                  sortable: true,
                  accessorKey: 'name',
                  cell: (c: any) => <strong className={`font-bold ${textHead}`}>{c.name}</strong>,
                },
                {
                  header: 'Category Name (BN)',
                  sortable: true,
                  accessorKey: 'nameBn',
                  cell: (c: any) => <span className={textSub}>{c.nameBn}</span>,
                },
                {
                  header: 'Actions',
                  cell: (c: any) => (
                    <button onClick={() => void handleDeleteCategory(c.id, c.name)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 4. COLORS TAB (CRUD) ------------------- */}
          {activeTab === 'colors' && (
            <AdminDataTable
              title="Product Color Variants"
              subtitle="Manage available color options for products"
              data={colorsList}
              isDark={isDark}
              onAddClick={() => setIsAddColorOpen(true)}
              addLabel="Add Color"
              searchPlaceholder="Search colors..."
              columns={[
                {
                  header: 'Color ID',
                  sortable: true,
                  accessorKey: 'id',
                  cell: (c: any) => <span className={`font-mono-brand ${textSub}`}>#{c.id}</span>,
                },
                {
                  header: 'Swatch',
                  cell: (c: any) => <span className="block h-7 w-7 rounded-full border-2 border-slate-400 shadow" style={{ backgroundColor: c.hex }} />,
                },
                {
                  header: 'Color Name',
                  sortable: true,
                  accessorKey: 'name',
                  cell: (c: any) => <strong className={`font-bold ${textHead}`}>{c.name}</strong>,
                },
                {
                  header: 'Hex Code',
                  sortable: true,
                  accessorKey: 'hex',
                  cell: (c: any) => <code className="font-mono-brand text-amber-500">{c.hex}</code>,
                },
                {
                  header: 'Actions',
                  cell: (c: any) => (
                    <button onClick={() => void handleDeleteColor(c.id, c.name)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 5. SIZES TAB (CRUD) ------------------- */}
          {activeTab === 'sizes' && (
            <AdminDataTable
              title="Product Size Variants"
              subtitle="Manage sizing options (Apparel, Footwear, etc.)"
              data={sizesList}
              isDark={isDark}
              onAddClick={() => setIsAddSizeOpen(true)}
              addLabel="Add Size"
              searchPlaceholder="Search sizes..."
              columns={[
                {
                  header: 'Size ID',
                  sortable: true,
                  accessorKey: 'id',
                  cell: (s: any) => <span className={`font-mono-brand ${textSub}`}>#{s.id}</span>,
                },
                {
                  header: 'Size Label',
                  sortable: true,
                  accessorKey: 'label',
                  cell: (s: any) => <strong className="font-bold text-amber-500">{s.label}</strong>,
                },
                {
                  header: 'Category',
                  sortable: true,
                  accessorKey: 'category',
                  cell: (s: any) => <span className={textSub}>{s.category}</span>,
                },
                {
                  header: 'Actions',
                  cell: (s: any) => (
                    <button onClick={() => void handleDeleteSize(s.id, s.label)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 6. ORDERS TAB ------------------- */}
          {activeTab === 'orders' && (
            <AdminDataTable
              title="Orders & Fulfillment"
              subtitle="Track and update customer order status"
              data={ordersQuery.data ?? []}
              isDark={isDark}
              searchPlaceholder="Search Order ID, customer name, phone..."
              columns={[
                {
                  header: 'Order ID',
                  sortable: true,
                  accessorKey: 'id',
                  cell: (o: any) => <span className="font-mono-brand font-bold text-amber-500">{o.id}</span>,
                },
                {
                  header: 'Customer',
                  sortable: true,
                  accessorKey: 'customerName',
                  cell: (o: any) => (
                    <div>
                      <strong className="block font-bold">{o.customerName}</strong>
                      <span className={`block text-[10px] ${textSub}`}>{o.phone}</span>
                    </div>
                  ),
                },
                {
                  header: 'Total Amount',
                  sortable: true,
                  accessorKey: 'total',
                  exportValue: (o: any) => `৳${o.total}`,
                  cell: (o: any) => <span className="font-bold text-emerald-500">৳{o.total}</span>,
                },
                {
                  header: 'Payment Method',
                  sortable: true,
                  accessorKey: 'paymentMethod',
                  cell: (o: any) => <span className={`uppercase ${textSub}`}>{o.paymentMethod}</span>,
                },
                {
                  header: 'Update Status',
                  sortable: true,
                  accessorKey: 'status',
                  cell: (o: any) => (
                    <select
                      disabled={updatingOrderId === o.id}
                      value={o.status}
                      onChange={(e) => void handleUpdateOrderStatus(o.id, e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none ${inputBg}`}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 7. USERS TAB ------------------- */}
          {activeTab === 'users' && (
            <AdminDataTable
              title="Registered Accounts"
              subtitle="Marketplace registered user profiles"
              data={usersList}
              isDark={isDark}
              searchPlaceholder="Search accounts by name or email..."
              columns={[
                {
                  header: 'User ID',
                  sortable: true,
                  accessorKey: 'id',
                  cell: (u: any) => <span className={`font-mono-brand ${textSub}`}>#{u.id}</span>,
                },
                {
                  header: 'Name',
                  sortable: true,
                  accessorKey: 'name',
                  cell: (u: any) => <strong className={`font-bold ${textHead}`}>{u.name}</strong>,
                },
                {
                  header: 'Email',
                  sortable: true,
                  accessorKey: 'email',
                  cell: (u: any) => <span className={`font-mono-brand ${textSub}`}>{u.email}</span>,
                },
                {
                  header: 'Role',
                  sortable: true,
                  accessorKey: 'role',
                  cell: (u: any) => (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-amber-600'}`}>
                      {u.role}
                    </span>
                  ),
                },
              ]}
            />
          )}

          {/* ------------------- 8. ADMIN PROFILE TAB ------------------- */}
          {activeTab === 'profile' && (
            <div className={`max-w-2xl rounded-2xl border p-6 md:p-8 ${cardBg}`}>
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={profileForm.imageUrl || user?.imageUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=Admin&backgroundColor=f57224'}
                  alt={profileForm.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-md"
                />
                <div>
                  <h2 className={`font-display text-2xl ${textHead}`}>Admin Profile Settings</h2>
                  <p className={`text-xs ${textSub}`}>Manage your personal credentials, contact info & security</p>
                </div>
              </div>

              <form onSubmit={(e) => void handleUpdateProfile(e)} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Admin Full Name"
                    className={`h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="admin@boloban.local"
                      className={`h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+880 1700 000000"
                      className={`h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Profile Photo (Image URL)</label>
                  <input
                    type="url"
                    value={profileForm.imageUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className={`h-10 w-full rounded-xl border px-3 font-mono-brand text-[11px] outline-none ${inputBg}`}
                  />
                </div>

                <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/80 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                  <label className="block font-bold mb-1">Change Password (Optional)</label>
                  <p className={`text-[11px] mb-2 ${textSub}`}>Leave blank to keep your current password intact</p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    placeholder="New password (8+ characters)"
                    className={`h-10 w-full rounded-xl border px-3 outline-none transition-colors ${
                      isDark ? 'border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:border-amber-400' : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ------------------- ADD / EDIT PRODUCT MODAL (WITH MULTI-IMAGES) ------------------- */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleSaveProduct(e)} className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border p-6 shadow-2xl md:p-8 ${modalBg}`}>
            <div className="shrink-0 mb-4">
              <h2 className={`font-display text-2xl ${textHead}`}>{editingProductId ? 'Edit Product' : 'Create Product Listing'}</h2>
              <p className={`mt-1 text-xs ${textSub}`}>Fill in product specifications and upload image files</p>
            </div>

            <div className={`space-y-3.5 text-xs flex-1 overflow-y-auto pr-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <div>
                <label className="block font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                >
                  {(categoriesQuery.data && categoriesQuery.data.length > 0) ? (
                    categoriesQuery.data.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Living</option>
                      <option value="beauty">Beauty & Care</option>
                      <option value="fresh-market">Fresh Market</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold">Selling Price (৳)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className={`mt-1 h-10 w-full rounded-xl border px-3 font-mono-brand outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold">Discount Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={productForm.discountRate}
                    onChange={(e) => setProductForm({ ...productForm, discountRate: e.target.value })}
                    placeholder="e.g. 15"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 font-mono-brand outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold">Original Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="Auto-calculated"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 font-mono-brand outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold">Stock Count</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className={`mt-1 h-10 w-full rounded-xl border px-3 font-mono-brand outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold">Badge Label</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Popular or Hot"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold">Product Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detailed product features, specifications, or usage instructions..."
                  className={`mt-1 w-full rounded-xl border p-3 outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Product Image File</label>
                <div className={`mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${isDark ? 'border-slate-800 bg-slate-900/50 hover:border-amber-500/50' : 'border-slate-300 bg-slate-50 hover:border-amber-500/50'}`}>
                  {productForm.image ? (
                    <div className="relative group w-full flex flex-col items-center">
                      <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
                        <img src={productForm.image} alt="Primary product preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white shadow-md hover:bg-red-700"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400">
                        <Upload size={14} />
                        Upload Different Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePrimaryImageFile}
                          className="hidden"
                          data-testid="input-product-image-file"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center py-4 w-full">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-bold">Click to upload product image file</span>
                      <span className={`mt-1 text-xs ${textSub}`}>Supports PNG, JPG, WEBP, GIF, SVG up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePrimaryImageFile}
                        className="hidden"
                        data-testid="input-product-image-file"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Additional Image Files</label>
                <div className="mt-1 space-y-3">
                  {productForm.additionalImages ? (
                    <div className="flex flex-wrap gap-3">
                      {productForm.additionalImages.split('\n').filter(Boolean).map((imgUrl, idx) => (
                        <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
                          <img src={imgUrl} alt={`Additional preview ${idx + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(idx)}
                            className="absolute top-1 right-1 rounded-full bg-red-600 p-0.5 text-white shadow-md hover:bg-red-700"
                            title="Remove additional image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-xs font-bold transition-colors ${isDark ? 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-amber-500' : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-amber-500'}`}>
                    <Upload size={16} className="text-amber-500" />
                    Upload Additional Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesFiles}
                      className="hidden"
                      data-testid="input-additional-images-file"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 shrink-0 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
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
          <form onSubmit={(e) => void handleAddCategory(e)} className={`w-full max-w-md rounded-3xl border p-6 text-xs shadow-2xl ${modalBg}`}>
            <h2 className={`font-display text-2xl ${textHead}`}>Create New Category</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className="block font-bold">Category Name (Bengali)</label>
                <input
                  type="text"
                  value={newCategory.nameBn}
                  onChange={(e) => setNewCategory({ ...newCategory, nameBn: e.target.value })}
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className={`rounded-xl border px-4 py-2 font-bold ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
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
          <form onSubmit={(e) => void handleAddColor(e)} className={`w-full max-w-md rounded-3xl border p-6 text-xs shadow-2xl ${modalBg}`}>
            <h2 className={`font-display text-2xl ${textHead}`}>Add Color Variant</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Color Name</label>
                <input
                  type="text"
                  required
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  placeholder="e.g. Midnight Black"
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className="block font-bold">Color Swatch (Hex Code)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className={`h-10 w-12 rounded-lg border p-1 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-white'}`}
                  />
                  <input
                    type="text"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className={`h-10 flex-1 rounded-xl border px-3 font-mono-brand outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddColorOpen(false)}
                className={`rounded-xl border px-4 py-2 font-bold ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
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
          <form onSubmit={(e) => void handleAddSize(e)} className={`w-full max-w-md rounded-3xl border p-6 text-xs shadow-2xl ${modalBg}`}>
            <h2 className={`font-display text-2xl ${textHead}`}>Add Size Option</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-bold">Size Label</label>
                <input
                  type="text"
                  required
                  value={newSize.label}
                  onChange={(e) => setNewSize({ ...newSize, label: e.target.value })}
                  placeholder="e.g. XL or 42"
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className="block font-bold">Size Category</label>
                <select
                  value={newSize.category}
                  onChange={(e) => setNewSize({ ...newSize, category: e.target.value })}
                  className={`mt-1 h-10 w-full rounded-xl border px-3 outline-none ${inputBg}`}
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Footwear">Footwear</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddSizeOpen(false)}
                className={`rounded-xl border px-4 py-2 font-bold ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
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
